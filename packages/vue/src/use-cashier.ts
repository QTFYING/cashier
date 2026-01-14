import type { PayParams, PayResult } from '@my-cashier/core';
import { computed, onBeforeUnmount, reactive, ref, toRefs, watch } from 'vue';
import { useCashierContext } from './cashier-context';
import { PaymentStatusEnum } from './enums';
import type { CashierState, UseCashierOptions } from './types';

export function useCashier(options: UseCashierOptions = {}) {
  const { cashier } = useCashierContext();
  const orderId = ref('');

  // 1. 初始化状态，增加 action 响应
  const state = reactive<CashierState>({ loading: false, status: null, result: null, error: null, action: null });

  // 2. 统一事件处理器
  const handleSuccess = (res: PayResult) => {
    state.status = 'success';
    state.result = res;
    state.loading = false;
    options?.onSuccess?.(res);
  };

  const handleFail = (err: any) => {
    state.status = 'fail';
    state.error = err;
    state.loading = false;
    options?.onError?.(err);
  };

  const handleStatusChange = (payload: { status: string; result?: any }) => {
    options?.onStatusChange?.(payload.status, payload.result);
    state.status = payload.status as any;
  };

  // 3. 监听逻辑优化：移出 onMounted 以支持更早的事件捕获
  cashier.on('success', handleSuccess);
  cashier.on('fail', handleFail);
  cashier.on('statusChange', handleStatusChange);

  // 4. 自动管理轮询：当状态变为终态时自动停止
  watch(
    () => state.status,
    (newStatus) => {
      if (newStatus === 'success' || newStatus === 'fail' || newStatus === 'cancel') {
        cashier.stopPolling();
      }
    },
  );

  onBeforeUnmount(() => {
    cashier.off('success', handleSuccess);
    cashier.off('fail', handleFail);
    cashier.off('statusChange', handleStatusChange);
    cashier.stopPolling(); // 卸载时强制停止，防止内存泄漏
  });

  const pay = async (strategyName: string, params: PayParams) => {
    state.loading = true;
    state.status = 'processing';
    try {
      const res = await cashier.execute(strategyName, params);
      // SDK 执行成功不代表支付成功（可能是唤起扫码），同步状态
      state.result = res;
      state.action = res.action ?? null;
      state.loading = false;
      return res;
    } catch (err: any) {
      handleFail(err);
      throw err;
    }
  };

  const reset = () => {
    state.loading = false;
    state.status = null;
    state.result = null;
    state.error = null;
    state.action = null;
    orderId.value = '';
    cashier.stopPolling();
  };

  const create = async (params: any) => {
    // 路径通过 SDK 实例的 base 配置获取，不再硬编码
    const { orderId: id } = await cashier.http.post('/payment/create', params);
    orderId.value = id;
    return id;
  };

  const statusText = computed(() => (state.status ? PaymentStatusEnum[state.status] : ''));

  return { ...toRefs(state), orderId, pay, reset, create, statusText, cashier };
}
