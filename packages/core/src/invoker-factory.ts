import { type Logger, type PayPlatformType } from '@my-cashier/types';
import { type PaymentInvoker } from './invokers/types';

// 探测器函数：返回 true 表示当前环境匹配
export type InvokerMatcher = (channel: string) => boolean;

// 构造器类型
export type InvokerConstructor = new (channel: PayPlatformType, logger?: Logger) => PaymentInvoker;

// 注册项接口
interface InvokerRegistration {
  type: string;
  InvokerClass: InvokerConstructor;
  matcher: InvokerMatcher;
  priority: number;
}

export class InvokerFactory {
  // 核心注册表
  private static registry: InvokerRegistration[] = [];

  /**
   * [新增] 注册自定义 Invoker
   * @param type 环境名称 (如 'tiktok-mini')
   * @param InvokerClass 实现类
   * @param matcher 探测函数
   * @param priority 优先级 (越高越先匹配)
   */
  static register(type: string, InvokerClass: InvokerConstructor, matcher: InvokerMatcher, priority: number = 0) {
    this.registry.push({ type, InvokerClass, matcher, priority });
    // 每次注册后重新排序，确保高优先级的先被遍历到
    this.registry.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 创建执行器实例
   */
  static create(channel: PayPlatformType, runtime?: string, logger?: Logger): PaymentInvoker {
    // Mode 1: 显式指定 (Explicit)
    // 场景：开发者明确知道自己在哪里，或者想强制使用某种模式
    if (runtime) {
      const item = this.registry.find((r) => r.type === runtime);
      if (item) {
        return new item.InvokerClass(channel, logger);
      }
      logger?.warn(`[InvokerFactory] Runtime "${runtime}" not found.`);
    }

    // Mode 2: 自动探测 (Auto Detect)
    // 遍历注册表，找到第一个匹配的环境
    for (const item of this.registry) {
      try {
        if (item.matcher(channel)) {
          // 将 channel 透传给 matcher
          // 调试模式下可以打印：console.log(`[InvokerFactory] Auto-detected: ${item.type}`);
          return new item.InvokerClass(channel, logger);
        }
      } catch {
        // 忽略探测过程中的报错 (防止访问未定义全局变量抛错)
        continue;
      }
    }

    // 用户没有注册任何 invoker
    throw new Error(`[InvokerFactory] No matching invoker found for channel: ${channel}. Please check if you have registered the correct invoker.`);
  }
}
