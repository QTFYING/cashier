import { defineConfig } from 'tsup';

const commonConfig = {
  entry: ['src/index.ts'],
  external: ['@my-cashier/types', '@my-cashier/utils'],
  clean: false,
  dts: false,
  treeshake: true,
};

export default defineConfig([
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
