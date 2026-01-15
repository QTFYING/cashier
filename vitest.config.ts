import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'packages/**/__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    alias: {
      '@my-cashier/core': new URL('./packages/core/src', import.meta.url).pathname,
      '@my-cashier/utils': new URL('./packages/utils/src', import.meta.url).pathname,
      '@my-cashier/types': new URL('./packages/types/src', import.meta.url).pathname,
    },
  },
});
