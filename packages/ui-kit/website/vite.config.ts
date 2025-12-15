import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { uikit } from '@ui-kit/core/vite';

export default defineConfig({
  plugins: [
    react(),
    uikit(),
  ],
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
