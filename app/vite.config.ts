import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { buildConstants } from './tools/build-constants.mjs';
export default defineConfig(({ mode, command }) => {
  const runtime = loadEnv(mode, __dirname, 'VITE_').VITE_ROCOTO_RUNTIME_BASE || 'http://127.0.0.1:18241';
  return { plugins: [react()], define: buildConstants({mode, command}),
    server: { host: '127.0.0.1', port: 18240, strictPort: true,
      proxy: { '/api': {target: runtime, changeOrigin: false} } },
    build: {outDir: 'dist', reportCompressedSize: false,
      rollupOptions: {input: {index: resolve(__dirname,'index.html'), bodega: resolve(__dirname,'bodega-pay-later.html')}}} };
});
