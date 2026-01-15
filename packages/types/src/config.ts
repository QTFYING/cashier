import type { PayPlatformType } from './enum';
import type { HttpClient } from './http';
import type { PaymentPlugin } from './lifecycle';
import { Logger } from './logger';

/**
 * SDK 全局配置接口
 * 属于核心契约，用户初始化时必须感知
 */
export interface SDKConfig {
  /** 是否开启调试模式 */
  debug?: boolean;

  /** 依赖注入的 HTTP 客户端 */
  http?: HttpClient;

  /** 自定义日志记录器 */
  logger?: Logger;

  /**
   * 指定使用的 Invoker 类型
   * - 'auto': 自动根据环境探测 (默认)
   * - 'wechat-mini': 强制使用微信小程序
   * - (channel) => type: 运行时动态决策
   */
  invokerType?: PayPlatformType | ((channel: string) => PayPlatformType);

  /** 基础设施插件列表 */
  plugins?: PaymentPlugin[];

  /** 是否启用默认插件 (默认为 true) */
  enableDefaultPlugins?: boolean;
}
