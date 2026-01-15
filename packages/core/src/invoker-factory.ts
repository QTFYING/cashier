import { type Logger, type PayPlatformType } from '@my-cashier/types';
import { type PaymentInvoker } from './invokers/types';

// 探测器函数：返回 true 表示当前环境匹配
export type InvokerMatcher = (channel: string) => boolean;

// 构造器类型 (包含静态属性)
export interface InvokerConstructor {
  new (channel: PayPlatformType, logger?: Logger): PaymentInvoker;
  type: string;
  matcher: InvokerMatcher;
}

// 注册项接口
interface InvokerRegistration {
  type: string;
  InvokerClass: InvokerConstructor;
  matcher: InvokerMatcher;
}

export class InvokerFactory {
  // 核心注册表
  private static registry: InvokerRegistration[] = [];

  /**
   * 注册自定义 Invoker
   * 方式 1: 传入类 (自动读取静态属性 type/matcher)
   * 方式 2: 手动传入 metadata (覆盖静态属性)
   */
  static register(InvokerClass: InvokerConstructor): void;
  static register(InvokerClass: any, metadata: { type: string; matcher: InvokerMatcher }): void;
  static register(InvokerClass: any, metadata?: { type: string; matcher: InvokerMatcher }) {
    const type = metadata?.type || InvokerClass.type;
    const matcher = metadata?.matcher || InvokerClass.matcher;

    if (!type || !matcher) {
      throw new Error(`InvokerRegistrationError: Class ${InvokerClass.name} missing static 'type' or 'matcher', and no metadata provided.`);
    }

    this.registry.push({ type, InvokerClass, matcher });
  }

  /**
   * 核心工厂方法
   * @param type 指定的类型 ('auto' | 'wechat-mini' ...)
   * @param channel 当前支付渠道 ('wechat' | 'alipay' ...)
   */
  static create(type: string, channel: string, logger?: Logger): PaymentInvoker {
    // Mode 1: 显式指定 (Explicit)
    // 场景：开发者明确知道自己在哪里，或者想强制使用某种模式
    if (type && type !== 'auto') {
      const item = this.registry.find((r) => r.type === type);
      if (item) {
        return new item.InvokerClass(channel, logger);
      }
      logger?.warn(`[InvokerFactory] Runtime "${type}" not found.`);
    }

    // Mode 2: 自动探测 (Auto Detect)
    // 遍历注册表，找到第一个匹配的环境
    for (let i = this.registry.length - 1; i >= 0; i--) {
      const item = this.registry[i];
      if (item.matcher(channel)) {
        logger?.info(`[InvokerFactory] Auto-detected invoker: ${item.type} for channel: ${channel}`);
        return new item.InvokerClass(channel as PayPlatformType, logger);
      }
    }

    throw new Error(`[InvokerFactory] Failed to auto-detect invoker for channel: ${channel}. current environment does not match any registered invokers.`);
  }
}
