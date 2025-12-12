import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Resolve @ui-kit/react to source for development (hot reload & proper CSS modules)
      '@ui-kit/react': resolve(__dirname, '../react/src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
