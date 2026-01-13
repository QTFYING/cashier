import { AlipayStrategy, PaymentContext, WechatStrategy, type SDKConfig } from '@/sdk/cashier2';
import { onBeforeUnmount, onMounted, provide } from 'vue';
import { CashierKey } from './cashier-context';
import { AuthPlugin, LoadingPlugin, LoggerPlugin } from './plugin';

interface CashierProviderOptions {
  config?: SDKConfig;
  client?: PaymentContext;
}

export function useCashierProvider({ config, client }: CashierProviderOptions) {
  const cashierInstance = client ?? (config ? new PaymentContext(config) : null);
  if (!cashierInstance) {
    throw new Error('[CashierProvider] You must provide either "config" or "client" prop.');
  }
  provide(CashierKey, { cashier: cashierInstance });

  onMounted(() => {
    cashierInstance
      .register(new WechatStrategy({ appId: 'wx888888', mchId: '123456' }))
      .register(new AlipayStrategy({ appId: '2021000000', privateKey: '...' }));

    cashierInstance.use(LoggerPlugin).use(LoadingPlugin).use(AuthPlugin);
  });

  onBeforeUnmount(() => {
    cashierInstance.stopPolling();
  });

  return cashierInstance;
}
