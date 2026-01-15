import { PayError, PaymentContext } from '@my-cashier/core';
import { ErrorCategory, PayParams, PayResult, PaymentState } from '@my-cashier/types';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { CashierContext } from './cashier-context';
import type { UseCashierOptions } from './types';
import { useStore } from './use-store';

/**
 * Hook: useCashier
 *
 * 核心支付 Hook，负责:
 * 1. 状态订阅与映射 (State Mapping)
 * 2. 插件自动注册 (Plugins)
 * 3. 事件桥接 (Event Bus)
 * 4. 动作封装 (Actions)
 * 5. 动作封装 (Actions)
 */
export function useCashier(options: UseCashierOptions = {}) {
  const { cashier } = useCashierContext();

  useInjectPlugins(cashier, options.plugins);
  useEventBus(cashier, options);

  const state = useCashierState(cashier);

  const pay = useCallback((strategyName: string, params: PayParams) => cashier.execute(strategyName, params), [cashier]);

  const reset = useCallback(() => {
    cashier.store.setState({ loading: false, status: 'idle', result: undefined, error: undefined });
  }, [cashier]);

  return {
    ...state,
    cashier,
    pay,
    reset,
    inferErrorType,
  };
}

/**
 * 确保 Hook 必须在 Provider 下使用
 */
function useCashierContext() {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error('useCashier must be used within a CashierProvider');
  }
  return context;
}

/**
 * 状态映射 Hook
 * 将 Store 的原始状态转换为 UI 友好的 derived state
 */
function useCashierState(cashier: PaymentContext) {
  const storeState = useStore<PaymentState>(cashier.store);
  return useMemo(() => {
    const isProcessing = storeState.status === 'processing' || storeState.status === 'pending';
    return {
      loading: storeState.loading || isProcessing,
      status: storeState.status || 'idle',
      result: storeState.result || null,
      error: (storeState.error as PayError) || null,
      action: storeState.result?.action || null,
    };
  }, [storeState]);
}

/**
 * 插件自动注册 Hook
 */
function useInjectPlugins(cashier: PaymentContext, plugins: UseCashierOptions['plugins']) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!plugins?.length || registeredRef.current) return;
    plugins.forEach((p) => cashier.use(p));
    registeredRef.current = true;
  }, [cashier, plugins]);
}

/**
 * Event Bus Hook
 * 将 SDK 的 EventBus 事件通过回调透传给 UI
 */
function useEventBus(cashier: PaymentContext, options: UseCashierOptions) {
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!cashier) return;

    const onSuccess = (res: PayResult) => optionsRef.current.onSuccess?.(res);
    const onFail = (err: any) => optionsRef.current.onError?.(err);
    const onStatusChange = ({ status, result }: any) => optionsRef.current.onStatusChange?.(status, result);

    cashier.on('success', onSuccess);
    cashier.on('fail', onFail);
    cashier.on('statusChange', onStatusChange);

    return () => {
      cashier.off('success', onSuccess);
      cashier.off('fail', onFail);
      cashier.off('statusChange', onStatusChange);
    };
  }, [cashier]);
}

/**
 * 错误类型推断工具
 * (Pure Function)
 */
function inferErrorType(err: any): { type: keyof typeof ErrorCategory; desc: string; error: any } {
  if (err instanceof PayError) {
    if (err.isSilent) return { type: ErrorCategory.SILENT, desc: 'Silent error. No need to handle the page, but attention is required.', error: err };
    if (err.shouldRetry) return { type: ErrorCategory.RETRYABLE, desc: 'You can initiate a retry.', error: err };
    return { type: ErrorCategory.FATAL, desc: 'You need to handle it yourself.', error: err };
  }

  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'System exception.';
  return { type: ErrorCategory.UNKNOWN, desc: message, error: err };
}
