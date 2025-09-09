# Technical Steering

Use these conventions when building and maintaining the extension.

## Tech Stack
- VS Code Extension (TypeScript)
- Node.js 16+
- Bundling: Webpack 5 (production build uses hidden source maps)
- Packaging: `vsce`
- Testing: Jest + ts-jest
- Templates/Prompts: Handlebars, gray-matter, js-yaml
- External runtime: Codex CLI (min version from `MIN_CODEX_CLI_VERSION`)

## Build System & Scripts (package.json)
- `npm run compile`: build prompts → `tsc` → `vsce package`
- `npm run watch`: `tsc -w` + prompt watcher
- `npm run package`: create `.vsix`
- `npm run package-web`: production webpack build (used by `build` & `vscode:prepublish`)
- Tests: `npm test`, `npm run test:watch`, `npm run test:coverage`

## Codex CLI Integration
- Build commands via `CommandBuilder` (`src/services/command-builder.ts`).
  - Approval mode flags: `-a on-request` | `-a on-failure` | `--full-auto`.
  - Model flag: `-m <model>`. Working directory: `-C <path>`.
- Resolve default paths/settings via `ConfigManager` and `DEFAULT_CONFIG`.
- Check availability and show guidance using `CodexProvider` before invoking.

## Common Commands (developer)
- Build: `npm run compile` or `npm run package-web`
- Run (VS Code): press F5 (Extension Development Host)
- Package: `npm run package` → `kiro-for-codex-<version>.vsix`
- Tests: `npm test`

## Project-Specific Conventions
- File layout under `src/`:
  - Entry: `extension.ts`; constants in `constants.ts`.
  - Feature managers under `features/<domain>/*-manager.ts` (e.g., `spec-manager.ts`, `steering-manager.ts`).
  - Tree providers under `providers/*-provider.ts`.
  - Services encapsulate IO/process concerns in `services/` (prompt loading, error handling, command building, retries).
  - Prompt sources in `src/prompts` with generated TypeScript in `src/prompts/target`.
- Respect feature flags in `src/constants.ts` to hide/disable views and commands.
- Only `paths.*` in `.codex/settings/kfc-settings.json` affect runtime resolution; other behavior is configured via VS Code settings (`kfc.*`).
- Never block the extension host thread; use VS Code progress notifications and split terminal for long Codex runs.

