# @my-cashier/react

React integration for the Cashier SDK.

## Installation

```bash
pnpm add @my-cashier/react @my-cashier/core
```

## Usage

### 1. Initialize SDK & Custom Plugins

Since `@my-cashier/react` is a pure binding layer, you should define your own plugins and register strategies.

**`src/lib/cashier.ts`**

```typescript
import { PaymentContext, WechatStrategy, AlipayStrategy, type PaymentPlugin } from '@my-cashier/core';

// Example: Define a Custom Logger Plugin
const MyLoggerPlugin: PaymentPlugin = {
  name: 'my-logger',
  onBeforePay(ctx) {
    console.log('Payment Starting:', ctx.params);
  },
  onSuccess(ctx, res) {
    console.log('Payment Success:', res);
  },
};

// 1. Create the instance
export const cashier = new PaymentContext({
  env: 'sandbox',
  logger: console,
});

// 2. Register Strategies
cashier.register(new WechatStrategy({ appId: '...', mchId: '...' })).register(new AlipayStrategy({ appId: '...', privateKey: '...' }));

// 3. Use Plugins
cashier.use(MyLoggerPlugin);
```

### 2. Wrap App with Provider

**`src/App.tsx`**

```tsx
import React from 'react';
import { CashierProvider } from '@my-cashier/react';
import { cashier } from './lib/cashier';
import { CheckoutPage } from './pages/Checkout';

export const App = () => {
  return (
    <CashierProvider client={cashier}>
      <CheckoutPage />
    </CashierProvider>
  );
};
```

### 3. Use Hooks

**`src/pages/Checkout.tsx`**

```tsx
import React, { useEffect } from 'react';
import { useCashier } from '@my-cashier/react';

export const CheckoutPage = () => {
  // Declarative Plugin Injection (Elegant Way)
  const { pay, loading } = useCashier({
    plugins: [
      {
        name: 'page-tracker',
        onSuccess: () => console.log('Page specific tracking'),
      },
    ],
  });

  const handlePay = async () => {
    try {
      await pay('wechat', {
        orderId: 'ORDER_001',
        amount: 100,
        description: 'Test Order',
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handlePay} disabled={loading}>
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};
```
