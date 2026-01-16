import { defineConfig } from 'tsup';

// 1. Common Configuration
const commonConfig = {
  entry: ['src/index.ts'],
  external: ['react', 'react-dom', '@my-cashier/core', '@my-cashier/types', '@my-cashier/utils'],
  clean: false, // Force manual cleaning
  dts: false, // Use tsc
  treeshake: true,
};

export default defineConfig([
  // 2. ESM Build
  {
    ...commonConfig,
    format: ['esm'],
    outDir: 'dist',
    entry: { index: 'src/index.ts' },
    minify: true,
    clean: false,
    dts: true,
    sourcemap: true,
  },
]);
