import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  minify: true,
  external: ['react', 'react-dom', '@my-cashier/core', '@my-cashier/types'],
  clean: true,
});
