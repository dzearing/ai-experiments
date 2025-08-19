import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use source files directly for ui-kit-react to avoid build issues
      '@claude-flow/ui-kit-react': path.resolve(__dirname, '../../packages/ui-kit-react/src'),
    },
  },
  server: {
    fs: {
      // Allow serving files from the packages directory
      allow: ['..'],
    },
  },
});
