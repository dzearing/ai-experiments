import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ClaudeFlowUIKitReact',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs'
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@claude-flow/ui-kit'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@claude-flow/ui-kit': 'ClaudeFlowUIKit'
        }
      }
    },
    sourcemap: true,
    minify: false
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});