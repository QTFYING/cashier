import type { Logger, PayResult } from '@my-cashier/types'; // 注意调整引用路径

/**
 * 支付执行器接口
 * 负责将"签名后的数据"发送给底层 SDK
 * 高级用户可以通过实现此接口来支持新的平台（如 TikTok, Stripe）
 */

export interface PaymentInvoker {
  logger?: Logger;
  invoke(payload: any): Promise<PayResult>;
}

/** ---------------------------------------- 接口定义（鸭子类型） ---------------------------------------- */

export interface WechatTypeGlobal {
  /**
   * 发起微信支付
   * @see https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html
   */
  requestPayment(options: {
    /** 时间戳，从 1970 年 1 月 1 日 00:00:00 至今的秒数，即当前的时间 */
    timeStamp: string;
    /** 随机字符串，长度为32个字符以下 */
    nonceStr: string;
    /** 统下单接口返回的 prepay_id 参数值，提交格式如：prepay_id=*** */
    package: string;
    /** 签名算法 */
    signType?: 'MD5' | 'HMAC-SHA256' | 'RSA' | string;
    /** 签名，具体签名方案参见小程序支付接口文档 */
    paySign: string;
    /** 接口调用成功的回调函数 */
    success?: (res: any) => void;
    /** 接口调用失败的回调函数 */
    fail?: (err: any) => void;
    /** 接口调用结束的回调函数（调用成功、失败都会执行） */
    complete?: (res: any) => void;
  }): void;
  /**
   * 打开另一个小程序
   * @see https://developers.weixin.qq.com/miniprogram/dev/api/open-api/miniprogram-navigate/wx.navigateToMiniProgram.html
   */
  navigateToMiniProgram(options: { appId: string; path?: string; extraData?: object; envVersion?: string; success?: (res: any) => void; fail?: (err: any) => void }): void;
}

export interface ByteDanceTypeGlobal {
  /**
   * 字节系小程序支付
   */
  pay(options: { orderInfo: object; service: number; success?: (res: any) => void; fail?: (err: any) => void }): void;
  /**
   * 打开另一个小程序
   */
  navigateToMiniProgram(options: { appId: string; path?: string; extraData?: object; envVersion?: string; success?: (res: any) => void; fail?: (err: any) => void }): void;
}

export interface AlipayTypeGlobal {
  tradePay(options: {
    tradeNO?: string;
    orderStr?: string; // 某些场景下可能用字符串
    success?: (res: any) => void;
    fail?: (err: any) => void;
  }): void;
  navigateToMiniProgram(options: { appId: string; path?: string; extraData?: object; success?: (res: any) => void; fail?: (err: any) => void }): void;
}

export interface UniAppTypeGlobal {
  requestPayment(options: {
    provider: string;
    orderInfo: string | object;
    timeStamp?: string;
    nonceStr?: string;
    package?: string;
    signType?: string;
    paySign?: string;
    success?: (res: any) => void;
    fail?: (err: any) => void;
  }): void;
}

// 扩展全局 Window 接口 (用于 H5 Bridge)
export interface WebPayTypeSack {
  WeixinJSBridge?: {
    invoke(method: 'getBrandWCPayRequest', args: any, callback: (res: any) => void): void;
  };
  AlipayJSBridge?: {
    call(method: 'tradePay', args: { tradeNO: string }, callback: (res: any) => void): void;
  };
}

/**
 * 原生 Bridge 集合 (NativeBridgeSack)
 * 允许扩充各种 Native Bridge 注入对象
 */
export interface NativeBridgeSack {
  /**
   * 通用 JSBridge (如 WebViewJavascriptBridge, DSBridge)
   */
  call?(method: string, data: any, callback?: (res: any) => void): Promise<any> | void;

  /**
   * iOS WKWebView MessageHandlers
   */
  webkit?: {
    messageHandlers?: {
      [key: string]: { postMessage: (msg: any) => void };
    };
  };

  /**
   * 允许任意其他注入对象
   */
  [key: string]: any;
}
