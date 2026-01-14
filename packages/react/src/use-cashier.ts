import { PayError } from '@my-cashier/core';
import type { PayParams, PayResult, PaymentState } from '@my-cashier/types';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { CashierContext } from './cashier-context';
import type { PayErrorAction, UseCashierOptions } from './types';
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
function useCashierState(cashier: any) {
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
function useInjectPlugins(cashier: any, plugins: UseCashierOptions['plugins']) {
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
function useEventBus(cashier: any, options: UseCashierOptions) {
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!cashier) return;

    const handlers = {
      success: (res: PayResult) => optionsRef.current.onSuccess?.(res),
      fail: (err: any) => optionsRef.current.onError?.(err),
      statusChange: ({ status, result }: any) => optionsRef.current.onStatusChange?.(status, result),
    };

    Object.entries(handlers).forEach(([evt, fn]) => cashier.on(evt, fn));

    return () => {
      Object.entries(handlers).forEach(([evt, fn]) => cashier.off(evt, fn));
    };
  }, [cashier]);
}

/**
 * 错误类型推断工具
 * (Pure Function)
 */
function inferErrorType(err: any): PayErrorAction {
  if (err instanceof PayError) {
    if (err.isSilent) return { type: 'silent', message: err.message, error: err };
    if (err.shouldRetry) return { type: 'retry', message: err.message, error: err };
    return { type: 'fatal', message: err.message, error: err };
  }

  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '系统异常';
  return { type: 'unknown', message, error: err };
}
