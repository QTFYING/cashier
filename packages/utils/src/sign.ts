/**
 * 签名工具类
 */

export const sign = (data: Record<string, any>, secret: string): string => {
  return 'mock_sign_' + Date.now();
};
