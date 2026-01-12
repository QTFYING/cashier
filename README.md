# Cashier Next SDK

<div align="center">

![Cashier Banner](https://via.placeholder.com/1200x300?text=Cashier+Next+SDK)

[![NPM Version](https://img.shields.io/npm/v/@cashier/core?style=flat-square&color=blue)](https://www.npmjs.com/package/@cashier/core)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/virgo/cashier/build.yml?branch=main&style=flat-square)](https://github.com/virgo/cashier/actions)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-007ACC?style=flat-square)](https://www.typescriptlang.org/)
[![Monorepo](https://img.shields.io/badge/Architecture-Monorepo-black?style=flat-square)](https://turbo.build/)

**面向未来的现代化支付中台 SDK**
*支持 Web / UniApp / 小程序 | 策略模式 | 插件化架构 | 极致轻量*

[快速开始](#-快速开始) • [文档说明](./guide) • [示例项目](./examples)

</div>

---

## 🌟 核心特性 (Highlights)

- **🏗 P9 级架构设计**：采用标准的**策略模式 (Strategy Pattern)** 实现多渠道切换，**洋葱模型**的插件系统实现能力解耦。
- **🔌 插件化生态**：内置 `Loading`, `Logger`, `Retry` 等插件，支持生命周期全链路 Hook（beforePay, onSign, afterPay）。
- **⚡️ 极致性能**：基于 **Monorepo** + **TSUP** 构建，利用 Tree-Shaking 技术，核心包体积仅 **KB** 级。
- **🧩 跨端适配**：底层执行器 (Invoker) 抽象，一套代码同时运行在 Browser, UniApp, 微信/支付宝小程序中。
- **🛡 类型安全**：全链路 **TypeScript** 编写，提供严谨的类型推导和智能提示。
- **📦 现代化工程**：基于 **PNPM + Turbo + Changesets** 的顶尖工程化实践。

## 🏗 技术架构 (Architecture)

Cashier SDK 采用经典的分层架构设计，确保核心逻辑的稳定与扩展性的平衡。

```mermaid
graph TD
    User[用户业务代码] --> Facade[PaymentContext (门面)]
    Facade --> Plugins[Plugin System (插件层)]
    Plugins --> Strategies[Strategy Layer (策略层)]
    Strategies --> Adapters[Adapter Layer (适配层)]
    Adapters --> Invokers[Invoker Layer (执行器层)]

    subgraph Core Logic
    Facade
    Plugins
    end

    subgraph Strategies
    WechatStrategy
    AlipayStrategy
    StripeStrategy
    end

    subgraph Adapters
    WechatAdapter
    AlipayAdapter
    end

    subgraph Invokers
    WebInvoker --> Browser
    UniAppInvoker --> UniApp
    MiniInvoker --> MiniProgram
    end
```

## 🛠 技术栈 (Tech Stack)

本项目采用目前前端业界最先进的开源库开发标准：

| 领域 | 技术选型 | 理由 |
| --- | --- | --- |
| **包管理** | **PNPM Workspace** | 利用硬链接机制极大节省磁盘空间，天然支持 Monorepo。 |
| **任务编排** | **Turborepo** | 下一代构建工具，利用缓存和并行执行，构建速度提升 80%。 |
| **打包构建** | **tsup (Esbuild)** | 基于 Go 语言的零配置打包工具，比 Rollup 快 100 倍。 |
| **版本/发布** | **Changesets** | 很多大型开源项目（如 React, Pnpm）使用的语义化发包工具。 |
| **测试** | **Vitest** | 基于 Vite 的测试框架，兼容 Jest API 但速度更快。 |
| **代码规范** | **ESLint + Prettier** | 严格的代码风格约束。 |

## 📦 安装 (Installation)

推荐使用 `pnpm` 进行安装，按需引入子包：

```bash
# 安装核心包
pnpm add @cashier/core @cashier/types

# 根据需要安装工具包
pnpm add @cashier/utils
```

## 🚀 快速开始 (Quick Start)

### 1. 初始化 SDK

```typescript
import { PaymentContext } from '@cashier/core';
import { WechatStrategy } from '@cashier/core/strategies'; // 或按需导出

// 1. 实例化上下文
const cashier = new PaymentContext({
  env: 'uniapp', // 或 'web', 'miniapp'
  debug: true,
  // 注入你的 HTTP 客户端 (Axios/Fetch)
  http: requestInstance
});

// 2. 注册策略
cashier.register(new WechatStrategy({
  appId: 'wx88888888',
  mchId: '123456789'
}));
```

### 2. 发起支付

```typescript
try {
  // 统一调用 execute，无需关心底层细节
  const result = await cashier.execute('wechat', {
    orderId: '202301010001',
    amount: 100, // 分
    desc: 'VIP 会员充值'
  });

  if (result.status === 'success') {
    console.log('支付成功', result.transactionId);
  }
} catch (err) {
  console.error('支付失败', err.message);
}
```

## 🤝 贡献 (Contributing)

欢迎提交 PR！

1.  Clone 项目
2.  `pnpm install`
3.  `turbo build` 构建产物
4.  `changeset` 生成变更记录
5.  提交 Pull Request

## 📄 License

MIT © 2024 Cashier Team
