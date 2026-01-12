import type { HttpClient } from '@cashier/types';

export const createDefaultFetcher = function (): HttpClient {
  return {
    get: (url: string, config?: any) => {
      return fetch(url, { method: 'GET', ...config }).then((r) => r.json());
    },
    post: (url: string, body: any, config?: any) => {
      return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json', ...config?.headers },
        ...config,
      }).then((r) => r.json());
    },
  };
};
