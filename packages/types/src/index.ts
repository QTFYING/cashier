// ==========================================  Level 1: Public Contract (核心类型)  ==========================================

// 1. 协议 (Params, Result, Actions)
export type { PaymentAction, PaymentChannel, PayParams, PayResult, PaySt, StrategyOptions } from './protocol';

// 2. 配置 (Config)
export type { SDKConfig } from './config';

// 3. 错误与枚举 (Errors)
export { ErrorCategory, PayErrorCode } from './errors';

// ==========================================  Level 2: Extension SPI (扩展协议)  ==========================================

// 4. 生命周期与插件 (Lifecycle)
export { type PaymentContextState, type PaymentPlugin, type PaymentState } from './lifecycle';

// 5. 网络层 (HTTP)
export type { HttpClient, HttpResponse } from './http';

// 6. 全局枚举
export * from './enum';
export * from './logger';
