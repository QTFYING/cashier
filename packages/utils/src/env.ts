/**
 * 环境探测工具
 */
declare const process: any;

export const isBrowser = typeof window !== 'undefined';
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

export const getEnv = () => {
  if (isBrowser) return 'browser';
  if (isNode) return 'node';
  return 'unknown';
};
