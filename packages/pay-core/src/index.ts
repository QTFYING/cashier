// 导出核心类
export { Store } from './cashier-store';
export { PaymentContext, type PaymentState } from './payment-context';

// 导出 Invoker 工厂,用户可自行注册Invoker，如·：uni.requestPayment
export { InvokerFactory } from './invoker-factory';

// 导出策略基类（方便用户自定义扩展）
export { ScriptLoader } from '@my-cashier/utils';
export { PayError } from './payment-error';
export { BaseStrategy } from './strategies/base-strategy';

// 导出内置策略
export { AlipayStrategy, WechatStrategy } from './strategies';

// 导出类型定义
export * from '@my-cashier/types';
