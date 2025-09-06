# Repository Guidelines

## Project Structure & Module Organization
- Source code lives in `src/`:
  - `commands/`, `providers/`, `services/`, `utils/`, `types/`, `features/`, `prompts/`, `resources/`.
  - Extension entry point: `src/extension.ts`.
- Tests live in `tests/` with `unit/` and `integration/` (snapshots under `__snapshots__/`).
- Assets: `icons/`, `screenshots/`; build output is bundled via Webpack into `dist/`.
- Generated prompt artifacts are written to `src/prompts/target/` — do not edit by hand.

## Build, Test, and Development Commands
- `npm run watch`: TypeScript watch + prompt builder for rapid local dev.
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
- Do not hardcode local paths or models; route process handling through `services/processManager.ts` and errors through `services/errorHandler.ts`.
- When adding commands or views, update `package.json` (`contributes`) and provide minimal, tested implementations.

## Agent & Prompt Authoring
- Author sources in `src/prompts/`; run `npm run build-prompts` (or `watch`) to regenerate. Avoid editing `src/prompts/target/` directly.
- Keep prompt YAML front‑matter concise and include examples for snapshot tests when applicable.

