# Repository Guidelines

## Project Structure & Module Organization
- Source code lives in `src/`:
  - `commands/`, `providers/`, `services/`, `utils/`, `types/`, `features/` (includes `agents/`, `spec/`, `steering/`), `prompts/`, `resources/`.
  - Extension entry point: `src/extension.ts`.
- Tests live in `tests/` with `unit/` and `integration` (snapshots under `tests/integration/__snapshots__/`).
- Assets: `icons/`, `screenshots/`; build output is bundled via Webpack into `dist/`.
- Generated prompt artifacts are written to `src/prompts/target/` — do not edit by hand.

## Build, Test, and Development Commands
- `npm run watch`: Concurrent TypeScript watch and prompt builder (see `scripts/watch-prompts.js`).
- `npm run build-prompts`: Convert Markdown prompts to TS under `src/prompts/target/`.
- `npm run compile`: Build prompts then compile TypeScript once.
- `npm run compile-web`: Webpack dev bundle for web/preview.
- `npm run package-web`: Production bundle with source maps; used by VSCE packaging.
- `npm run package`: Create a VS Code extension `.vsix` with `vsce`.
- `npm test` / `npm run test:watch` / `npm run test:coverage`: Run Jest, watch mode, or coverage.
Example: `npm ci && npm run watch` (dev) or `npm run package-web && npm run package` (release).

## Coding Style & Naming Conventions
- Language: TypeScript; use 2‑space indentation, semicolons, and `async/await`.
- Filenames: `camelCase.ts` (e.g., `codexProvider.ts`); classes use `PascalCase`.
- Suffixes: view/data providers end with `Provider`, services end with `Service`.
- Keep modules focused; place shared types in `src/types/` and constants in `src/constants.ts`.
- In-source language: Write all source-code messages and comments in English (including user-facing strings, log/output messages, and code comments).

## Testing Guidelines
- Framework: Jest with `ts-jest`; Node test environment.
- Test files: `*.test.ts` under `tests/unit` or `tests/integration` (mirror source paths when possible).
- Mocks: VS Code API is mocked in `tests/__mocks__/vscode.ts`.
- Coverage: `npm run test:coverage` outputs to `coverage/`; target ≥ 80% lines/branches for new code.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `wip:`.
- Messages: short, imperative subject; add scope when useful (e.g., `feat(providers): ...`).
- PRs must include: clear description, linked issues, screenshots/GIFs of UI changes, test notes, and docs updates when relevant.

## Security & Configuration Tips
- Never commit secrets; read user configuration via VS Code settings (`kfc.*`, e.g., `kfc.codex.*`).
- Do not hardcode local paths or models; route process handling through `services/process-manager.ts` and errors through `services/error-handler.ts`.
- When adding commands or views, update `package.json` (`contributes`) and provide minimal, tested implementations.

## VS Code Views & Feature Flags
- Views: `Specs`, `Steering`, `Prompts`, and `Settings` are contributed. `Agents`, `Hooks`, and `MCP Servers` exist but are disabled by default in this build.
- Code-level feature flags in `src/constants.ts` take precedence:
  - `ENABLE_MCP_UI = false`, `ENABLE_HOOKS_UI = false`, `ENABLE_AGENTS_UI = false`.
  - `ENABLE_SPEC_AGENTS = false` disables the “New Spec with Agents” flow.
- Settings toggles under `kfc.views.*.visible` control visibility, but some views have `when: "false"` in `package.json` and remain hidden regardless of settings while disabled.

## Workspace Layout & Settings File
- Default workspace paths (configurable via `.codex/settings/kfc-settings.json`):
  - Specs: `.codex/specs`
  - Steering: `.codex/steering`
  - Prompts: `.codex/prompts`
  - Settings: `.codex/settings`
- The extension also exposes VS Code settings under the `kfc` namespace (see `package.json > contributes > configuration`). Paths are primarily managed by the workspace settings file, while Codex CLI options are exposed via VS Code settings.

## Codex CLI Integration
- Minimum Codex CLI version: see `MIN_CODEX_CLI_VERSION` in `src/constants.ts` (currently `0.28.0`). The extension checks availability on activation and can surface setup guidance.
- Settings keys:
  - `kfc.codex.path` (default: `codex`), `kfc.codex.defaultModel` (default: `gpt-5`), `kfc.codex.timeout`, `kfc.codex.terminalDelay`, `kfc.codex.defaultApprovalMode`.
- Approval modes (extension → CLI flags) via `CommandBuilder`:
  - `interactive` → `-a on-request`
  - `auto-edit` → `-a on-failure`
  - `full-auto` → `--full-auto`
- All external process handling must go through `services/process-manager.ts`; surface user-facing errors via `services/error-handler.ts`.

- Author Markdown prompts under `src/prompts/` (e.g., `spec/`, `steering/`). Run `npm run build-prompts` (or `watch`) to regenerate TS modules in `src/prompts/target/`. Do not edit generated files manually.
- Front matter must at least include: `id`, `name`, `version`, `description`; define `variables` with `required: true` when applicable. Integration tests validate parsing and snapshots.


## Adding Commands, Views, or Features
- Update `package.json` under `contributes` (`views`, `commands`, `menus`, `configuration`).
- Register commands in `src/extension.ts` or the relevant feature manager under `src/features/*`.
- Add tree providers under `src/providers/*Provider.ts` and register them during activation.
- When integrating new CLI flows, wire via `CodexProvider` and `CommandBuilder`; avoid shelling out directly.

## Notes on Disabled/Experimental Areas
- Agents UI, Hooks UI, and MCP views are intentionally disabled (see constants and `package.json` `when: "false"`). Do not enable without ensuring corresponding CLI support and tests.
- The extension asks for confirmation when saving `.codex/agents/*.md` files; keep this guard intact until agent-edit flows are finalized.
