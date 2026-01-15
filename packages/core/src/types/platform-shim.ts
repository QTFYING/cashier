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

export interface JSBridgeGlobal {
  call(method: string, data: any, callback?: (res: any) => void): Promise<any> | void;
}
