# Requirements Document — Vite/Vitest Migration

## Introduction

This feature migrates the build and test toolchain from Webpack 5 and Jest/ts-jest to Vite (Rollup-based) and Vitest while preserving the current VS Code extension packaging behavior via `vsce`. The goals are to simplify configuration, speed up builds and tests (including watch mode), improve ESM/CJS handling, and maintain parity with existing outputs and developer workflows. Functional behavior of the extension must remain unchanged.

Scope includes: replacing bundling (Webpack → Vite SSR/Node), replacing tests (Jest/ts-jest → Vitest in Node env), updating `package.json` scripts and CI to the new stack, and updating docs. Out of scope: functional changes to the extension, directory/public API changes, or enabling features gated by flags in `src/constants.ts`.

Steering alignment: follow `.codex/steering/tech.md` for build/packaging and CLI integration; resolve `.codex/**` paths via `ConfigManager`; respect Decision Precedence and feature flags in `src/constants.ts`; do not overwrite `.codex/steering/*` directly.

## Requirements

### Requirement 1 — Build parity using Vite

**User Story:** As a maintainer, I want to build the extension with Vite SSR/Node so that I get faster builds while preserving the current artifact layout and activation behavior.

#### Acceptance Criteria (EARS)
1. WHEN `npm run build` is executed THEN the system SHALL output `dist/extension.js` in CommonJS format produced by a Vite SSR/Node build.
2. IF the `vscode` module is imported during bundling THEN the system SHALL externalize it so it is not bundled and is resolved by VS Code at runtime.
3. WHEN the build completes THEN the system SHALL copy all files under `src/resources/**` to `dist/resources/**` with the original directory structure and byte-identical contents.
4. WHEN source maps are generated THEN the system SHALL produce external source maps without inlined sources and with mappings to original TypeScript for debugging.
5. WHEN `vsce package` is run against the Vite-built output THEN the produced `.vsix` SHALL install and activate successfully in an Extension Development Host without runtime errors.
6. WHEN launching the Extension Development Host (F5) using a Vite-built artifact THEN the extension SHALL activate without runtime errors and features SHALL behave identically to the current build.

### Requirement 2 — Testing migration to Vitest

**User Story:** As a contributor, I want tests to run under Vitest in a Node environment so that I can keep using familiar Jest-like APIs with faster execution.

#### Acceptance Criteria (EARS)
1. WHEN `npm test` is run THEN the system SHALL execute Vitest in a Node environment over `tests/**/*.test.ts`.
2. IF a test imports `vscode` THEN the runner SHALL resolve it to `tests/__mocks__/vscode.ts` via an alias.
3. WHEN migrating from Jest THEN the codebase SHALL replace all `jest.*` usages (including timers, spies, and mocks) with `vi.*` equivalents.
4. WHEN coverage is generated locally or in CI THEN the system SHALL produce reports using the V8 provider with coverage at least equal to the current baseline.
5. IF snapshot tests exist THEN the test behavior and snapshot storage locations SHALL remain consistent under Vitest.

### Requirement 3 — Scripts and CI use Vite/Vitest

**User Story:** As a CI maintainer, I want updated scripts and workflows so that PR and release pipelines run against Vite/Vitest on Node 20.

#### Acceptance Criteria (EARS)
1. WHEN running `npm run build` in CI THEN the workflow SHALL build with Vite successfully on Node.js 20.
2. WHEN running `npm test` in CI THEN the workflow SHALL run Vitest and publish coverage artifacts.
3. WHEN a pull request is opened THEN `.github/workflows/on-pr.yml` SHALL execute build and test jobs using the Vite/Vitest toolchain.
4. WHEN the release workflow executes THEN compilation and `vsce package` SHALL succeed using Vite-built artifacts.

### Requirement 4 — Documentation reflects the new stack

**User Story:** As a developer, I want updated docs so that I can use Vite/Vitest commands without confusion.

#### Acceptance Criteria (EARS)
1. WHEN reading the README and test guide THEN the documents SHALL reference “Vite / Vitest” instead of “Webpack 5 / Jest + ts-jest”.
2. IF docs contain obsolete commands or examples THEN the documents SHALL replace them with Vite/Vitest equivalents and remove outdated content.

### Requirement 5 — Phased rollout without disruption

**User Story:** As a project steward, I want a safe two-phase rollout so that we can validate parity before removing legacy tooling.

#### Acceptance Criteria (EARS)
1. WHEN Phase 1 completes THEN the repository SHALL contain Vite/Vitest configs and scripts alongside existing Webpack/Jest with no removals.
2. WHEN parity is demonstrated locally and in a temporary CI job THEN Phase 2 SHALL switch default scripts (`build`, `test`, `vscode:prepublish`) to Vite/Vitest.
3. WHEN defaults are switched in Phase 2 THEN the repository SHALL remove Webpack/Jest configs and devDependencies.
4. IF regressions are detected during Phase 2 THEN the system SHALL allow reverting to a Phase 1 state via version control without loss of functionality.

### Requirement 6 — Non-functional constraints and Steering compliance

**User Story:** As a project steward, I want the migration to respect repository rules so that governance and tooling contracts remain intact.

#### Acceptance Criteria (EARS)
1. WHEN accessing `.codex/steering` content THEN contributors SHALL treat it as read-only and perform changes only via defined feature flows.
2. WHEN resolving `.codex/**` paths in code or scripts THEN the system SHALL use `ConfigManager.getPath(...)` and SHALL NOT hardcode absolute paths.
3. IF a feature is gated by a flag in `src/constants.ts` THEN the migration SHALL NOT change that flag’s default value.
4. WHEN integrating with the CLI tooling THEN the system SHALL continue using `CodexProvider`, `CommandBuilder`, and `ProcessManager` per `AGENTS.md`.
5. WHEN writing files in this migration THEN the system SHALL restrict writes to approved directories and SHALL NOT overwrite `.codex/steering/*`.

### Requirement 7 — Developer experience and performance

**User Story:** As a developer, I want faster incremental builds and reliable debugging so that iteration speed and productivity improve.

#### Acceptance Criteria (EARS)
1. WHEN running a watch build THEN the system SHALL provide incremental rebuilds faster than the current Webpack setup.
2. WHEN building for SSR/Node THEN the system SHALL handle ESM/CJS interop without manual shims.
3. WHEN debugging in VS Code THEN breakpoints SHALL bind to original TypeScript via the generated source maps.

### Requirement 8 — Risk mitigations are enforced

**User Story:** As a maintainer, I want explicit mitigations so that known bundling and mapping risks are prevented.

#### Acceptance Criteria (EARS)
1. IF bundling would include `vscode` by default THEN the build configuration SHALL prevent bundling it via `external: ['vscode']`.
2. IF copying `src/resources/**` fails during build THEN the build process SHALL provide an alternative step (e.g., static copy plugin or postbuild script) to ensure assets are present under `dist/resources/**`.
3. IF source maps include sources inline by default THEN the configuration SHALL disable inlined sources and keep external maps.
4. IF Jest-specific globals remain AFTER migration THEN the test suite SHALL fail with actionable errors indicating replacement with `vi.*` APIs.

