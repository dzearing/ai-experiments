import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: './postcss.config.js',
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        theme: resolve(__dirname, 'src/theme.ts'),
        'theme-switcher': resolve(__dirname, 'src/theme-switcher.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'styles.css';
          return assetInfo.name;
        },
        // Prevent any code splitting - each entry should be self-contained
        manualChunks: () => undefined,
      },
    },
    cssCodeSplit: false,
    outDir: 'dist',
  },
});
