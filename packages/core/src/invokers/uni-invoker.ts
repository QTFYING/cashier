import { type Logger, type PayResult, PayErrorCode } from '@my-cashier/types';
import { PayError } from '../payment-error';
import type { PaymentInvoker, UniAppTypeGlobal } from './types';

// 声明 uni 对象，防止 TS 报错
declare const uni: UniAppTypeGlobal;

export class UniAppInvoker implements PaymentInvoker {
  constructor(
    private provider: string,
    public logger?: Logger,
  ) {}

  static type = 'uni-app';
  static matcher = (_channel: string) => typeof uni !== 'undefined' && !!uni.requestPayment;

  async invoke(orderInfo: any): Promise<PayResult> {
    return new Promise((resolve, reject) => {
      // UniApp 的统一调用方式
      uni.requestPayment({
        provider: this.provider,
        orderInfo: orderInfo, // 后端签名的原始数据

        // 微信小程序特有参数
        timeStamp: orderInfo.timeStamp,
        nonceStr: orderInfo.nonceStr,
        package: orderInfo.package,
        signType: orderInfo.signType,
        paySign: orderInfo.paySign,

        success: (res: any) => {
          resolve({ status: 'success', raw: res });
        },
        fail: (err: any) => {
          // 这里的 err 也是 UniApp 统一封装过的
          if (err.errMsg && err.errMsg.includes('cancel')) {
            resolve({ status: 'cancel', raw: err });
          } else {
            reject(new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, err.errMsg, 'uniapp'));
          }
        },
      });
    });
  }
}
