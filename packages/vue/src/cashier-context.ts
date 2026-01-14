import type { PaymentContext } from '@my-cashier/core';
import type { InjectionKey } from 'vue';
import { inject, provide } from 'vue';

export const CashierKey: InjectionKey<{ cashier: PaymentContext }> = Symbol('CashierKey');

export function provideCashier(ctx: PaymentContext) {
  provide(CashierKey, { cashier: ctx });
}

export function useCashierContext() {
  const c = inject(CashierKey, null);
  if (!c) {
    throw new Error('useCashier must be used after provideCashier');
  }
  return c;
}
