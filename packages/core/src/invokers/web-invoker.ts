import { type Logger, PayErrorCode, PaymentChannelEnum, type PayPlatformType } from '@my-cashier/types';
import { PayError } from '../payment-error';
import type { PaymentInvoker } from './types';
import { AlipayWebHandler, WebInvokerFactory, WechatWebHandler } from './web';

WebInvokerFactory.register(PaymentChannelEnum.WE_CHAT, new WechatWebHandler());
WebInvokerFactory.register(PaymentChannelEnum.ALI_PAY, new AlipayWebHandler());

export class WebInvoker implements PaymentInvoker {
  constructor(
    private channel: PayPlatformType = 'other',
    public logger?: Logger,
  ) {}

  static type = 'web';
  static matcher = (_channel: string) => typeof window !== 'undefined' && typeof document !== 'undefined';

  /**
   * 暴露静态注册方法，允许外部注册新的 Web 渠道
   * 示例: WebInvoker.register('stripe', new StripeWebHandler());
   */
  static register(channel: string, handler: any) {
    WebInvokerFactory.register(channel, handler);
  }

  async invoke(payload: any): Promise<any> {
    try {
      const handler = WebInvokerFactory.get(this.channel);

      if (handler) return await handler.handle(payload);

      throw new Error(`[WebInvoker] No handler found for channel: ${this.channel}`);
    } catch (error: any) {
      throw new PayError(PayErrorCode.INVOKE_FAILED, error.message || 'Web Invoke Failed', error);
    }
  }
}
