import { type Logger, type SDKConfig } from '@my-cashier/types';

/**
 * 默认的 Console Logger 实现
 * 仅在 debug 模式下输出 Info/Debug 日志
 * 生产环境下只保留 Warn/Error
 */
export class ConsoleLogger implements Logger {
  constructor(private isDebugMode: boolean = false) {}

  info(message: string, ...args: any[]) {
    if (this.isDebugMode) {
      console.log(`[Cashier] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.isDebugMode) {
      console.debug(`[Cashier] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[Cashier] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[Cashier] ${message}`, ...args);
  }
}

/**
 * 工厂函数：创建 Logger 实例
 * 优先级：用户自定义 Logger > 默认 ConsoleLogger
 */
export function createLogger(config: SDKConfig): Logger {
  if (config.logger) {
    return config.logger;
  }
  return new ConsoleLogger(config.debug);
}
