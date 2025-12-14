import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Get all component entry points
function getComponentEntries() {
  const componentsDir = resolve(__dirname, 'src/components');
  const entries: Record<string, string> = {
    index: resolve(__dirname, 'src/index.ts'),
  };

  try {
    const files = readdirSync(componentsDir);
    for (const file of files) {
      if (file.endsWith('.tsx') && !file.includes('.stories.') && !file.includes('.test.')) {
        const name = file.replace('.tsx', '');
        entries[`icons/${name}`] = resolve(componentsDir, file);
      }
    }
  } catch {
    // Components directory doesn't exist yet (first build)
  }

  return entries;
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: getComponentEntries(),
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // Use entry names for output files
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    sourcemap: true,
    outDir: 'dist',
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
