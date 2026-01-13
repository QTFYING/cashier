import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  minify: true,
  external: ['@my-cashier/types', '@my-cashier/utils'],
  clean: true,
});
