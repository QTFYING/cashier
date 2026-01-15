import { type Logger, PayErrorCode, type PayResult } from '@my-cashier/types';
import { PayError } from '../payment-error';
import type { AlipayTypeGlobal, ByteDanceTypeGlobal, PaymentInvoker, WechatTypeGlobal } from './types';

declare const wx: WechatTypeGlobal;
declare const my: AlipayTypeGlobal;
declare const tt: ByteDanceTypeGlobal;
declare const uni: any;

/**
 * 小程序内跳转小程序插件支付（国内规则均一致）
 * 用于在小程序环境中跳转到其他小程序（如云闪付收银台、拉卡拉等）
 * - 自动识别 Wechat / Alipay / ByteDance / UniApp 环境
 * - 抹平 navigateToMiniProgram API 差异
 */
export class MiniProgramJumpInvoker implements PaymentInvoker {
  constructor(
    private _channel: string,
    public logger?: Logger,
  ) {}

  static type = 'mini-program-jump';
  static matcher = (_channel: string) => false;

  async invoke(data: any): Promise<PayResult> {
    const { targetAppId, path, extraData, envVersion = 'release' } = data;

    if (!targetAppId) {
      throw new PayError(PayErrorCode.PARAM_INVALID, 'Missing targetAppId for MiniProgramJumpInvoker', 'mini-program-jump');
    }

    return new Promise((resolve, reject) => {
      const successCallback = (res: any) => {
        this.logger?.info('MiniProgram jump success', res);
        // 通常跳转后，需要用户在另一个小程序支付，然后返回。
        // 返回后需通过 App.onShow 检查支付结果，或者轮询后端。
        // Sdk在这里认为 "Success" 仅仅代表 "Jump Success" -> status: pending
        resolve({
          status: 'pending',
          message: 'Jumped to external MiniProgram',
          raw: res,
        });
      };

      const failCallback = (err: any) => {
        reject(new PayError(PayErrorCode.INVOKE_FAILED, err.errMsg || 'Jump failed', 'miniprogram-jump'));
      };

      try {
        // 1. 微信小程序
        if (typeof wx !== 'undefined' && wx.navigateToMiniProgram) {
          wx.navigateToMiniProgram({ appId: targetAppId, path, extraData, envVersion, success: successCallback, fail: failCallback });
          return;
        }

        // 2. 支付宝小程序
        if (typeof my !== 'undefined' && my.navigateToMiniProgram) {
          my.navigateToMiniProgram({ appId: targetAppId, path, extraData, success: successCallback, fail: failCallback });
          return;
        }

        // 3. 抖音小程序
        if (typeof tt !== 'undefined' && tt.navigateToMiniProgram) {
          tt.navigateToMiniProgram({ appId: targetAppId, path, extraData, envVersion, success: successCallback, fail: failCallback });
          return;
        }

        // 4. UniApp (兼容处理)
        if (typeof uni !== 'undefined' && uni.navigateToMiniProgram) {
          uni.navigateToMiniProgram({ appId: targetAppId, path, extraData, envVersion, success: successCallback, fail: failCallback });
          return;
        }

        throw new Error('Current environment does not support navigateToMiniProgram');
      } catch (e: any) {
        reject(new PayError(PayErrorCode.NOT_SUPPORTED, e.message, 'mini-program-jump'));
      }
    });
  }
}
