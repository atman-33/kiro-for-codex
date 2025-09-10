import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    // SSR build targeting Node environment
    ssr: true,
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: 'src/extension.ts',
      // Externalize vscode module to prevent bundling
      external: ['vscode'],
      output: {
        entryFileNames: 'extension.js',
        // CommonJS output format
        format: 'cjs',
        // Generate external source maps without inlined sources
        sourcemapExcludeSources: true
      }
    }
  },
  plugins: [
    // Configure static copy plugin for src/resources to dist/resources
    viteStaticCopy({
      targets: [
        {
          src: 'src/resources',
          dest: 'resources'
        }
      ]
    })
  ]
});