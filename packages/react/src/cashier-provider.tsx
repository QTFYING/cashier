import { PaymentContext, type SDKConfig } from '@my-cashier/core';
import React, { useEffect, useMemo } from 'react';
import { CashierContext } from './cashier-context';

// 2. 定义 Provider 的 Props
// 提供两种模式：
// A. 懒人模式：传 config，Provider 帮你 new
// B. 高级模式：传 client，你在外面 new 好了传进来 (适合需要复杂配置或单例导出的场景)
interface CashierProviderProps {
  config?: SDKConfig;
  client?: PaymentContext;
  children: React.ReactNode;
}

/**
 * 核心组件：CashierProvider
 * 应该包裹在你的 App 最外层
 */
export const CashierProvider: React.FC<CashierProviderProps> = ({ config, client, children }) => {
  // 3. 实例化逻辑 (保证全局单例)
  // useMemo 确保只有在 config/client 变化时才重新创建，防止重复 new
  const cashier = useMemo(() => {
    // 优先使用用户传入的现成实例
    if (client) return client;
    // 否则根据配置自动创建一个新实例
    if (config) return new PaymentContext(config);
    throw new Error('[CashierProvider] You must provide either "config" or "client" prop.');
  }, [config, client]);

  useEffect(() => {
    return () => {
      if (!client && cashier) cashier.destroy();
    };
  }, [cashier, client]);

  return <CashierContext.Provider value={{ cashier }}>{children}</CashierContext.Provider>;
};
