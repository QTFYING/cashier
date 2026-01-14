import type { PayError } from '@my-cashier/core';
import type { PayParams, PayResult, PaySt, PaymentAction, PaymentPlugin } from '@my-cashier/types';

// --- 入参配置 ---
export interface UseCashierOptions {
  // 1. 自动注册的插件 (可选)
  // 场景：进入这个页面时，自动挂载一个"倒计时插件"或"页面级埋点插件"
  plugins?: PaymentPlugin[];

  // 2. 事件回调 (EventBridge)
  onSuccess?: (result: PayResult) => void;
  onError?: (error: PayError) => void;
  onStatusChange?: (status: string, result?: PayResult) => void; // 比如监听轮询状态

  // 3. 初始倒计时 (秒)
  autoCountDown?: number;
}

// --- 出参接口 ---
export interface CashierActions {
  pay: (strategyName: string, params: PayParams) => Promise<PayResult>;
  reset: () => void;
}

export interface CashierState {
  loading: boolean;
  status: PaySt | null;
  result: PayResult | null;
  error: PayError | null;
  action: PaymentAction | null;
}

export type PayErrorAction =
  | { type: 'silent'; message: string; error: PayError }
  | { type: 'retry'; message: string; error: PayError }
  | { type: 'fatal'; message: string; error: PayError }
  | { type: 'unknown'; message: string; error: unknown };
