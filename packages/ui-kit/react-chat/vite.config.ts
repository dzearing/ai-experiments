/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx', 'src/**/*.test.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'services/claudeCode/index': resolve(__dirname, 'src/services/claudeCode/index.ts'),
      },
      name: 'UIKitReactChat',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@ui-kit/react',
        '@ui-kit/core',
        '@ui-kit/icons',
        '@tiptap/core',
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/extension-placeholder',
        '@tiptap/extension-link',
        '@tiptap/pm',
        'tiptap-markdown',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
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
