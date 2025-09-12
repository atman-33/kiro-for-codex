import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    // SSR build targeting Node environment
    ssr: true,
    outDir: 'dist',
    // Ensure previous artifacts are removed to avoid stale duplicates
    emptyOutDir: true,
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
        sourcemapExcludeSources: true,
        interop: 'compat'
      }
    }
  },
  plugins: [
    // Copy only the direct children of src/resources (e.g., agents/, prompts/)
    // to dist/resources, preserving their internal structure and avoiding
    // an extra nested "resources" directory.
    viteStaticCopy({
      targets: [
        {
          src: 'src/resources/*',
          dest: 'resources'
        }
      ]
    })
  ]
});
