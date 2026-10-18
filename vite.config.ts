import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import electron from 'vite-plugin-electron/simple';

const alias = {
  '@shared': resolve(__dirname, 'src/shared'),
  '@renderer': resolve(__dirname, 'src/renderer'),
  '@main': resolve(__dirname, 'src/main'),
};

// SEM_ELECTRON=1: só o renderer (navegador, testes automáticos e build do Android).
const comElectron = !process.env.SEM_ELECTRON;

export default defineConfig({
  base: './', // o app é carregado por file:// no Electron e pelo WebView no Android
  resolve: { alias },
  plugins: [
    react(),
    ...(comElectron
      ? [electron({
        main: { entry: 'src/main/index.ts', vite: { resolve: { alias }, build: { outDir: 'dist-electron' } } },
        preload: { input: 'src/main/preload.ts', vite: { resolve: { alias }, build: { outDir: 'dist-electron' } } },
      })]
      : []),
  ],
  // o servidor só vigia o código: evidências, referências, builds e o projeto Android mudam (e travam arquivos) durante os testes
  server: { host: '127.0.0.1', port: 5173, strictPort: true, watch: { ignored: ['**/evidencias/**', '**/referencias/**', '**/release/**', '**/dist*/**', '**/android/**', '**/docs/**', '**/tools/**'] } },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});


