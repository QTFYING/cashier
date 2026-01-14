/**
 * 核心业务模型 (Params, Result, Enum)
 * 负责定义 SDK 的核心数据结构，包括：
 * - 统一支付入参 (PayParams)
 * - 统一支付结果 (PayResult)
 * - 核心枚举定义 (Enum)
 */

/**
 * 统一支付结果状态
 * - pending 待支付
 * - processing 处理中
 * - success 支付成功
 * - fail 支付失败
 * - refunded 已退款
 * - cancel 已取消
 */
export type PaySt = 'pending' | 'processing' | 'success' | 'fail' | 'refunded' | 'cancel';

/**
 * 定义支持的支付渠道
 * - wechat 微信支付
 * - alipay 支付宝
 * - stripe Stripe 国际支付
 * - custom 自定义渠道
 */
export type PaymentChannel = 'wechat' | 'alipay' | 'stripe' | 'custom';

/**
 * 统一支付入参
 * 业务层调用 SDK (cashier.pay) 时只需要关注这些通用字段
 */
export interface PayParams {
  /**
   * 是否自动开启轮询
   * @default false
   * 如果为 true，SDK 会在发起支付后自动轮询查询接口
   */
  autoPoll?: boolean;

  /**
   * 业务侧唯一订单号
   * 建议全局唯一，避免重复支付
   */
  orderId: string;

  /**
   * 支付金额
   * 建议统一为最小单位（如分），避免浮点数精度问题
   */
  amount: number;

  /**
   * 币种
   * @default 'CNY'
   * 符合 ISO 4217 标准的币种代码
   */
  currency?: string;

  /**
   * 商品描述
   * 显示在支付页面的商品说明
   */
  description?: string;

  /**
   * 扩展字段
   * 用于透传某些渠道特有的参数，SDK 会将其透传给具体的 Strategy
   * 例如：微信JSAPI可能需要 openid，支付宝Wap可能需要 return_url
   */
  extra?: Record<string, any>;
}

/**
 * 支付动作类型
 * - qrcode 展示二维码
 * - url_jump URL 跳转 (适合 H5 / App)
 * - none 无需操作 (如静默支付或纯 API 模式)
 */
export type PaymentActionType = 'qrcode' | 'url_jump' | 'none';

/**
 * 支付动作对象
 * 当 Strategy 返回 nextAction 时，SDK 会返回此对象供 UI 层处理
 */
export interface PaymentAction {
  /**
   * 动作类型
   */
  type: PaymentActionType;

  /**
   * 动作值
   * - type='qrcode' 时，value 为二维码内容 (url)
   * - type='url_jump' 时，value 为跳转地址
   */
  value: string;
}

/**
 * 统一支付结果
 * 屏蔽了具体 SDK (微信/支付宝) 的返回差异，业务层仅需处理此结构
 */
export interface PayResult {
  /**
   * 最终支付状态
   */
  status: PaySt;

  /**
   * 第三方流水号
   * 例如 Wechat Transaction ID 或 Alipay Trade No
   * 仅在 success/refunded 等状态下可能存在
   */
  transactionId?: string;

  /**
   * 结果描述信息
   * 用于展示给用户或记录日志
   */
  message?: string;

  /**
   * 原始返回数据
   * 包含第三方 SDK 返回的完整数据，作为逃生舱，方便排查问题
   */
  raw?: any;

  /**
   * 下一步动作
   * 当状态为 pending/processing 且需要用户通过二维码/跳转继续支付时存在
   */
  action?: PaymentAction;
}

/**
 * 策略 (Strategy) 的基本配置接口
 * 所有具体支付策略的配置都应继承此接口
 */
export interface StrategyOptions {
  /**
   * 策略名称
   * 允许覆盖默认策略名，用于多实例区分
   */
  name?: string;

  /**
   * 调试模式
   * @default false
   * 开启后会输出详细的日志
   */
  debug?: boolean;

  /**
   * 模拟模式 - 暂未实现
   * @default false
   * 开启后不会真实发起支付，而是模拟成功/失败流程
   */
  mock?: boolean;
}
