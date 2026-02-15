import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

const isElectron = process.env.VITE_ELECTRON === 'true' ||
  process.argv.includes('--mode') && process.argv.includes('electron');

export default defineConfig({
  plugins: [
    react(),
    ...(isElectron ? [
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: { external: ['electron', 'better-sqlite3'] },
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(args) { args.reload(); },
        },
      ]),
      renderer(),
    ] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@modules': path.resolve(__dirname, 'src/modules'),
    },
  },
  build: { outDir: 'dist' },
});
