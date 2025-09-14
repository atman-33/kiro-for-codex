import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Build a tiny React app for VS Code Webview.
// Output goes under ../dist/webview/codex-chat to be packaged with the extension.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: resolve(__dirname, '../dist/webview/codex-chat'),
    emptyOutDir: true,
    // Use stable filenames for webview HTML
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});
