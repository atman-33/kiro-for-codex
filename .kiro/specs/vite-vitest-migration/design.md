# Design Document — Vite/Vitest Migration

## Overview
This design migrates the project from Webpack 5 and Jest/ts-jest to Vite (Rollup-based) and Vitest while preserving the VS Code extension packaging flow using `vsce`. The build targets Node/SSR, outputs `dist/extension.js` in CommonJS, externalizes `vscode`, copies `src/resources/**` to `dist/resources/**`, and emits external source maps (no inlined sources). Tests run under Vitest in a Node environment with a Jest-compatible API and an alias that maps `vscode` to a test-time mock.

Key goals
- Faster incremental builds and simpler configuration
- Jest-compatible test APIs via Vitest for smooth migration
- Parity with current outputs, CI, and packaging
- No functional changes to the extension

Assumptions and context
- Current entry: `src/extension.ts` (per `webpack.config.js`)
- Output artifact: `dist/extension.js` (CJS) with `vscode` externalized
- Static assets copied from `src/resources` (CopyPlugin in current Webpack)
- CI uses Node.js 20 and `vsce package` via workflows under `.github/workflows/*`

## Architecture

```mermaid
flowchart LR
  A[TypeScript Sources\nsrc/**/*.ts] -->|Vite SSR build\nRollup| B[dist/extension.js\nCJS + sourcemap]
  A -->|Static Assets| C[dist/resources/**]
  B --> D[vsce package]
  C --> D
  subgraph Test
    E[tests/**/*.test.ts]\n--> F[Vitest Node env]\n--> G[Reports: text, lcov, html]
  end
```

Core architecture decisions
- Build with Vite SSR (Node) and Rollup output format `cjs` to `dist/extension.js`.
- Externalize `vscode` to avoid bundling the VS Code host module.
- Copy `src/resources/**` to `dist/resources/**` with identical structure.
- Generate external source maps (no sources inlined) for reliable debugging.
- Run tests in Vitest (Node env) with Jest-compat APIs, mapping `vscode` to `tests/__mocks__/vscode.ts`.
- Keep a two-phase rollout: introduce alongside legacy (Phase 1), switch defaults and remove legacy (Phase 2).

## Components and Interfaces

- Build configuration (`vite.config.ts`)
  - `build.ssr: true`
  - `build.outDir: 'dist'`
  - `build.sourcemap: true`
  - `rollupOptions.input: 'src/extension.ts'`
  - `rollupOptions.output.entryFileNames: 'extension.js'`
  - `rollupOptions.output.format: 'cjs'`
  - `rollupOptions.output.sourcemapExcludeSources: true`
  - `rollupOptions.external: ['vscode']`
  - Static copy: `vite-plugin-static-copy` patterns `{ src: 'src/resources', dest: 'resources' }`

- Test configuration (`vitest.config.ts`, `vitest.setup.ts`)
  - `test.environment: 'node'`
  - `test.include: ['tests/**/*.test.ts']`
  - `resolve.alias: { vscode: '<rootDir>/tests/__mocks__/vscode.ts' }`
  - `coverage.reporter: ['text','lcov','html']` (V8)
  - Setup file for global config, timers, and snapshot tuning equivalent to Jest settings

- Scripts (`package.json`)
  - Phase 1 (parallel): `build:vite`, `test:vitest`, keep existing `build`/`test` defaulting to Webpack/Jest
  - Phase 2 (cutover): flip `build`, `test`, and `vscode:prepublish` to Vite/Vitest; remove legacy scripts and devDeps
  - Preserve `build-prompts` and ensure it runs before `vite build`

- CI Workflows (`.github/workflows/on-pr.yml`, `release.yml`)
  - Use Node 20
  - `npm ci`
  - `npm run build` and `npm test` after cutover
  - Keep release packaging step using `vsce package` on Vite-built outputs

- Packaging (VS Code / `vsce`)
  - The `main` field remains `./dist/extension.js`
  - Ensure `vsce package` succeeds with Vite outputs

- Integration boundaries (per AGENTS.md)
  - Do not hardcode `.codex/**` absolute paths; if referenced in tooling, resolve via `ConfigManager`
  - Use CLI abstractions (`CodexProvider`, `CommandBuilder`, `ProcessManager`) where the extension invokes external tools

## Data Models
This migration primarily configures tools; there are no persistent domain data models. Relevant configuration “models”:
- Vite config object (`defineConfig`): SSR build, Rollup options, externals, sourcemaps
- Vitest config object: test environment, includes, alias, coverage
- Copy patterns: `{ src: 'src/resources', dest: 'resources' }`
- Package.json scripts: ensure ordering (`build-prompts` → `vite build`)

## Error Handling
- Build-time errors
  - Missing externals: treat bundling of `vscode` as a configuration failure; fail build with clear message
  - Asset copy failures: build must fail fast and print which files couldn’t be copied; provide fallback script path
  - Sourcemap policy: if `sourcemapExcludeSources` not respected, fail release build and log remediation
- Test-time errors
  - Residual `jest.*` usage: fail tests with guidance to switch to `vi.*`
  - Mock resolution: if `vscode` alias fails, tests should error with an actionable message
- CI/Release
  - If `vsce package` fails on Vite output, block release and attach build artifacts/logs for diagnosis

## Testing Strategy
- Unit tests (Vitest)
  - Convert existing Jest tests to Vitest (`jest.fn` → `vi.fn`, timers, `jest.spyOn` → `vi.spyOn`)
  - Keep snapshot locations/format consistent; configure in `vitest.setup.ts`
- Build verification tests
  - Scripted check that `dist/extension.js` exists and is CommonJS (e.g., simple static assertion and/or Node `require` smoke test under mock `vscode`)
  - Verify that `dist/resources/**` mirrors `src/resources/**` (recursive directory comparison in a test helper)
- Source map validation
  - Assert `.map` files exist and are external; in unit tests, parse source map headers to ensure sources are excluded
- CI gates
  - On PR: run `npm run build` (Vite) and `npm test` (Vitest) on Node 20; upload coverage

## Research Summary
Given limited network access, this design relies on established practices:
- Vite SSR builds can target Node with Rollup `format: 'cjs'` and `external: ['vscode']` for VS Code extensions
- `vite-plugin-static-copy` or a small post-build Node script reliably mirrors `src/resources` to `dist/resources`
- Vitest provides Jest-compat APIs (`vi.fn`, `vi.spyOn`, fake timers) and V8 coverage reporters

Open questions carried from requirements
1) Static copy via plugin vs. postbuild script — both are supported; plugin preferred to minimize custom code
2) Dev watch: keep `tsc -w` for F5 or switch to `vite build --watch` — start with existing `tsc -w` for stability, evaluate later
3) Source map strictness — default to external maps with excluded sources; adjust if compliance requires stricter handling

## Decisions and Rationale
- Use `vite-plugin-static-copy` (Decision): fewer moving parts than custom scripts; still allow fallback script
- Keep `build-prompts` pre-step (Decision): maintained parity with current pipeline
- Phase rollout (Decision): reduce risk and enable quick rollback between tags/branches
- Node 20 in CI (Decision): aligns with PR workflow and modern toolchain support

## Example Config Sketches

`vite.config.ts` (sketch)
```ts
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: 'src/extension.ts',
      external: ['vscode'],
      output: {
        entryFileNames: 'extension.js',
        format: 'cjs',
        sourcemapExcludeSources: true
      }
    }
  },
  plugins: [
    viteStaticCopy({ targets: [{ src: 'src/resources', dest: 'resources' }] })
  ]
});
```

`vitest.config.ts` (sketch)
```ts
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
```

## Compliance with Steering and AGENTS.md
- Respect Decision Precedence; do not toggle flags in `src/constants.ts`
- Treat `.codex/steering/*` as read-only; reference via feature flows
- Resolve any `.codex/**` paths with `ConfigManager.getPath(...)` when needed; avoid absolute paths
- Use `CodexProvider`/`CommandBuilder`/`ProcessManager` for CLI interactions in extension code

## Risks and Mitigations
- Bundling `vscode` by accident — enforce `external: ['vscode']`; add a post-build sanity check
- Asset copy drift — pin plugin version; include directory-compare test helper in CI
- Hidden source maps mismatch — assert `sourcemapExcludeSources` effective via automated test
- Jest API remnants — fail tests on usage; add codemod or lint rule to guide migration

