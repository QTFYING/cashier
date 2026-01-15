import { type Logger, PayErrorCode, PayResult } from '@my-cashier/types';
import { PayError } from '../payment-error';
import type { PaymentInvoker, WechatTypeGlobal } from './types';

/**
 * 声明 wx 全局对象。
 * 使用自定义的 WechatTypeGlobal Shim 而不是 @types/wechat-miniprogram
 * 是为了避免引入外部依赖以及防止全局命名空间污染，确保核心包的轻量与独立性。
 */
declare const wx: WechatTypeGlobal;

export class WechatMiniInvoker implements PaymentInvoker {
  constructor(
    private _provider: string,
    public logger?: Logger,
  ) {}

  async invoke(payload: any): Promise<PayResult> {
    return new Promise((resolve, reject) => {
      // 防御性检测：确保 wx 对象存在
      if (typeof wx === 'undefined' || !wx.requestPayment) {
        reject(new PayError(PayErrorCode.NOT_SUPPORTED, 'wx.requestPayment is not available', 'wechat-mini'));
        return;
      }

      // 微信原生 API 调用
      wx.requestPayment({
        timeStamp: payload.timeStamp,
        nonceStr: payload.nonceStr,
        package: payload.package,
        signType: payload.signType,
        paySign: payload.paySign,

        // 成功回调
        success: (res: any) => {
          resolve({
            status: 'success',
            raw: res,
            transactionId: payload.package, // 小程序回调通常不带单号，暂用 package 里的 prepay_id 替代或留空
            message: 'Wechat payment success',
          });
        },

        // 失败回调
        fail: (err: any) => {
          // 微信原生取消通常是 errMsg: "requestPayment:fail cancel"
          if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
            resolve({ status: 'cancel', message: 'User cancelled', raw: err });
          } else {
            reject(new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, err.errMsg || 'Wechat Mini Payment Failed', 'wechat-mini'));
          }
        },
      });
    });
  }
}
