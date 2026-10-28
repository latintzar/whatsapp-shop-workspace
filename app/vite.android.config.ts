import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'bodega-mobile-pure-walk',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/prototypes/bodega-pay-later/start/walk.tsx')) return;
      // The native entry reuses motion and Pass, never the web route registry or its prefetches.
      return code.replace("import.meta.glob('./*.tsx')", '{}');
    },
  }, react()],
  server: { host: '127.0.0.1', port: 5314, strictPort: true },
  build: { outDir: 'dist-android', emptyOutDir: true, copyPublicDir: false,
    rollupOptions: { input: resolve(__dirname, 'android.html') } },
});
