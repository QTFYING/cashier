# SDK Invoker 接入指南

本文档详细介绍了 `@my-cashier/core` 中 Invoker（支付执行器）的接入方式，涵盖了从基础的微信小程序到复杂的混合 App 场景。

## 1. 核心概念

为实现**包体积最小化 (Tree-shaking)** 和 **极致灵活 (Late-binding)**，SDK 采用了 **"按需注入 + 动态决策"** 的架构。

- **按需注入**：您用到哪个平台的支付能力，就注入对应的 `Invoker` 类。没用到的代码不会被打包。
- **动态决策**：通过 `invokerType` 配置，您可以在支付发起的最后一刻，根据当前环境和渠道决定使用哪种支付方式。

---

## 2. 标准场景接入 (90% 情况)

对于单一环境的应用，通常显式注入，由 SDK 自动探测环境。

### 场景 A：微信小程序 (支持微信支付 + 聚合云闪付)

后端接口直接返回微信参数 (timeStamp, nonceStr 等)，无需特殊处理。

```typescript
import { PaymentContext, WechatMiniInvoker } from '@my-cashier/core';

// 初始化：只注入微信小程序能力
const cashier = new PaymentContext()
  .injectInvoker(WechatMiniInvoker);

// 发起支付
// SDK 自动匹配到 WechatMiniInvoker -> 调用 wx.requestPayment
cashier.pay('wechat', { ... });
cashier.pay('unionpay', { ... }); // 聚合渠道也是同样的处理逻辑
```

### 场景 B：Web / H5 / 公众号

一套代码同时运行在 **微信浏览器 (JSAPI)** 和 **外部浏览器 (H5 跳转)**。

```typescript
import { PaymentContext, WebInvoker } from '@my-cashier/core';

// 初始化：注入 Web 能力
// WebInvoker 内部会自动判断 UserAgent
const cashier = new PaymentContext()
  .injectInvoker(WebInvoker);

// 发起支付
// - 微信内：自动调起 WeixinJSBridge
// - 浏览器：自动 location.href 跳转 MWeb URL
cashier.pay('wechat', { ... });
```

### 场景 C：UniApp / Taro 多端编译

利用构建工具的环境变量，按需加载。

```typescript
import { PaymentContext, UniAppInvoker } from '@my-cashier/core';

const cashier = new PaymentContext().injectInvoker(UniAppInvoker);

cashier.pay('wechat', { ... });
```

---

## 3. 高级场景接入 (复杂混合)

当一套代码运行在复杂容器中，或需要根据渠道切换不同的交互方式时，使用 `Late-binding` (延迟绑定)。

### 场景 D：小程序内跳转云闪付 (Mini Program Jump)

如果云闪付渠道要求 **跳转到云闪付小程序** 完成支付，而不是直接调起支付控件。

```typescript
import { PaymentContext, WechatMiniInvoker, MiniProgramJumpInvoker } from '@my-cashier/core';

const cashier = new PaymentContext({
  // 【关键配置】运行时动态路由
  invokerType: (channel) => {
    // 遇到云闪付渠道，强制使用小程序跳转模式
    if (channel === 'unionpay') {
      return 'mini-program-jump';
    }
    // 其他情况（如 wechat），走默认的自动探测
    return 'auto';
  },
})
  // 注入所需能力
  .injectInvoker(WechatMiniInvoker) // 负责 wx.requestPayment
  .injectInvoker(MiniProgramJumpInvoker); // 负责 wx.navigateToMiniProgram
```

### 场景 E：抖音/头条小程序 (混合环境)

抖音环境比较特殊，支持抖音支付 (Native)，但支付宝/微信通常需要“降级”处理（如跳 Web 或 跳小程序）。

```typescript
import { PaymentContext, WebInvoker, MiniProgramJumpInvoker } from '@my-cashier/core';
import { env } from '@my-cashier/utils';

const cashier = new PaymentContext({
  invokerType: (channel) => {
    if (env.isDouyin) {
      // 抖音里用支付宝 -> 降级为 Web 页面 (假设后端支持)
      if (channel === 'alipay') return 'web';

      // 抖音里用微信 -> 跳转微信小程序
      if (channel === 'wechat') return 'mini-program-jump';
    }
    return 'auto';
  },
})
  .injectInvoker(WebInvoker)
  .injectInvoker(MiniProgramJumpInvoker);
```

---

## 4. 自定义扩展

### 场景 F：开发测试 (Mock)

本地开发无法调起真实支付，使用 Mock 模拟成功/失败。

```typescript
// 1. 定义 Mock Invoker
class MockInvoker {
  static type = 'mock';
  static matcher = () => process.env.NODE_ENV === 'development'; // 仅开发环境生效

  async invoke(data: any) {
    console.log('Mock Payment Data:', data);
    // 模拟延时
    await new Promise((r) => setTimeout(r, 1000));
    return { status: 'success', transactionId: 'mock_123' };
  }
}

// 2. 注入
const cashier = new PaymentContext();
if (process.env.NODE_ENV === 'development') {
  cashier.injectInvoker(MockInvoker);
}
```

### 场景 G：自有资产支付 (积分/金币)

不调用第三方 SDK，完全由后端逻辑控制扣款。

```typescript
class PointInvoker {
  static type = 'point-pay';
  static matcher = () => false; // 不自动匹配

  async invoke(data: any) {
    // 调用您的后端积分扣除接口
    return fetch('/api/pay/point', { body: JSON.stringify(data) }).then((res) => res.json());
  }
}

cashier.injectInvoker(PointInvoker).pay('point', { amount: 100 });
```

---

## 总结

| 场景                     | 核心动作                                | 关键配置                                                                |
| :----------------------- | :-------------------------------------- | :---------------------------------------------------------------------- |
| **标准微信/支付宝**      | `injectInvoker(WechatMiniInvoker)`      | 默认 (Zero Config)                                                      |
| **标准 H5 (JSAPI/MWeb)** | `injectInvoker(WebInvoker)`             | 默认 (Zero Config)                                                      |
| **跳云闪付小程序**       | `injectInvoker(MiniProgramJumpInvoker)` | `invokerType: (ch) => ch === 'unionpay' ? 'mini-program-jump' : 'auto'` |
| **混合 App 开发**        | 注入所有可能的 Invoker                  | 使用 `invokerType` 函数进行精细化路由                                   |
