import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: { reporter: ['text', 'lcov', 'html'], provider: 'v8' }
  },
  resolve: {
    alias: { vscode: path.resolve(__dirname, 'tests/__mocks__/vscode.ts') }
  }
});
