/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { uikit } from '@ui-kit/core/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    uikit({
      defaultTheme: 'default',
      themesPath: '/themes',
    }),
  ],
  resolve: {
    alias: {
      // Resolve CSS to dist, JS to source for hot reload
      '@ui-kit/react/style.css': path.resolve(__dirname, '../../../packages/ui-kit/react/dist/style.css'),
      '@ui-kit/react': path.resolve(__dirname, '../../../packages/ui-kit/react/src'),
      '@ui-kit/react-chat': path.resolve(__dirname, '../../../packages/ui-kit/react-chat/src'),
      '@ui-kit/react-markdown': path.resolve(__dirname, '../../../packages/ui-kit/react-markdown/src'),
      '@ui-kit/router': path.resolve(__dirname, '../../../packages/ui-kit/router/src'),
    },
  },
  server: {
    host: true,
    port: 5190, // Ideate-specific port
    strictPort: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
