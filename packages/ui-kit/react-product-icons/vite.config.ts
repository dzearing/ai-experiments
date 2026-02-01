import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { readdirSync } from 'fs';

/**
 * Get all component entry points (no barrel/index file)
 * Each product icon is its own entry point for tree-shaking.
 */
function getComponentEntries() {
  const componentsDir = resolve(__dirname, 'src/components');
  const entries: Record<string, string> = {
    // Types export for consumers who need type definitions
    types: resolve(__dirname, 'src/utils/types.ts'),
    // Factory function export
    createProductIcon: resolve(__dirname, 'src/utils/createProductIcon.tsx'),
  };

  try {
    const files = readdirSync(componentsDir);

    for (const file of files) {
      if (file.endsWith('.tsx') && !file.includes('.stories.') && !file.includes('.test.')) {
        const name = file.replace('.tsx', '');
        // Each icon is its own entry point - no barrel file
        entries[name] = resolve(componentsDir, file);
      }
    }
  } catch {
    // Components directory doesn't exist yet or is empty (first build)
  }

  return entries;
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'],
      // Flatten the output to match JS file locations
      beforeWriteFile: (filePath, content) => {
        // Rewrite paths like dist/components/WordIcon.d.ts to dist/WordIcon.d.ts
        const newPath = filePath
          .replace('/components/', '/')
          .replace('/utils/', '/');

        return { filePath: newPath, content };
      },
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
