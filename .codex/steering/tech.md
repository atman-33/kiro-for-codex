# Technical Steering

Use these conventions when building and maintaining the extension.

## Tech Stack
- VS Code Extension (TypeScript)
- Node.js 16+
- Bundling: esbuild for the extension; Vite for webview UI
- Packaging: `vsce`
- Testing: Vitest
- Templates/Prompts: Handlebars, gray-matter, js-yaml
- External runtime: Codex CLI (min version from `MIN_CODEX_CLI_VERSION`)

## Build System & Scripts (package.json)
- `npm run build`: build prompts → esbuild bundle (`dist/extension.js`) → copy resources → build webview (Vite)
- `npm run build:ext`: esbuild bundle from `src/extension.ts` to `dist/extension.js`
- `npm run build:webview`: build webview UI under `webview-ui/` with Vite to `dist/webview/app`
- `npm run watch`: `tsc -w` + prompt watcher (for type‑checking and fast iteration)
- `npm run package`: create `.vsix` with `vsce`
- `vscode:prepublish`: runs `npm run build`
- Tests (Vitest): `npm test`, `npm run test:watch`, `npm run test:coverage`

## Codex CLI Integration
- Build commands via `CommandBuilder` (`src/services/command-builder.ts`).
  - Approval mode flags: `-a on-request` | `-a on-failure` | `--full-auto`.
  - Model flag: `-m <model>`. Working directory: `-C <path>`.
- Resolve default paths/settings via `ConfigManager` and `DEFAULT_CONFIG`.
- Check availability and show guidance using `CodexProvider` before invoking.

## Common Commands (developer)
- Build: `npm run build` (esbuild + Vite)
- Run (VS Code): press F5 (Extension Development Host)
- Package: `npm run package` → `kiro-for-codex-<version>.vsix`
- Tests: `npm test`

## Project-Specific Conventions
- File layout under `src/`:
  - Entry: `extension.ts`; constants in `constants.ts`.
  - Feature managers under `features/<domain>/*-manager.ts` (e.g., `spec-manager.ts`, `steering-manager.ts`, `codex-chat/chat-manager.ts`).
  - Tree/webview providers under `providers/*-provider.ts` (e.g., `codex-chat-view-provider.ts`, `create-new-spec-panel-provider.ts`).
  - Services encapsulate IO/process concerns in `services/` (prompt loading, error handling, command building, retries).
  - Prompt sources in `src/prompts` with generated TypeScript in `src/prompts/target`.
- Respect feature flags in `src/constants.ts` to hide/disable views and commands.
- Only `paths.*` in `.codex/settings/kiroCodex-settings.json` affect runtime resolution; other behavior is configured via VS Code settings (`kiroCodex.*`).
- Never block the extension host thread; use VS Code progress notifications and split terminals for long Codex runs.
