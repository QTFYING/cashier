import type { Logger, PayParams, PayResult, PaySt } from '@my-cashier/types';
import { Emitter } from '@my-cashier/utils';

/**
 * 定义事件名与对应载荷(Payload)的映射关系
 * 这是实现强类型的关键
 */
export interface SDKEventMap {
  // 支付开始前（适合做埋点、开启 Loading）
  beforePay: PayParams;
  // 支付动作发起（此时通常意味着用户跳转走了，或者弹窗出来了）
  payStart: { strategyName: string };

  // 支付最终结果（成功、失败、取消）
  success: PayResult;
  fail: PayResult;
  cancel: PayResult;

  // 任意状态变更（适合做通用的日志监控）
  statusChange: { status: PaySt; result?: PayResult };
}

export class EventBus extends Emitter<SDKEventMap> {
  constructor(protected logger: Logger) {
    super(logger);
  }
}
