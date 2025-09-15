# Product Steering

Use this guide to keep the VS Code extension "Kiro for Codex" aligned with its purpose and workflow.

## Purpose & Value
- Provide a spec‑driven development workflow powered by Codex CLI inside VS Code.
- Let users manage Specs, Steering docs, Prompts, and Chat visually via views.
- Reduce ambiguity by guiding AI actions with repository‑specific rules and paths.

## Core Features (enforce in code/UX)
- Spec Workflow: Requirements → Design → Tasks with explicit approvals.
  - Navigate via commands `kiroCodex.spec.navigate.*` and CodeLens on `tasks.md`.
  - New: "Create New Spec" opens a focused editor (webview) to capture the initial request before generation.
- Steering Docs: generate and edit guidance under `.codex/steering/`.
- Prompts: scaffold and run `.codex/prompts/<name>.md` in a split terminal with Codex CLI.
- Chat: a dedicated sidebar webview to start/continue conversations with Codex.
  - Supports single‑shot runs and streaming via the Codex terminal session.
- Settings bootstrap: create `.codex/settings/kiroCodex-settings.json` with defaults on first run.
- Codex availability checks and setup guidance if missing or incompatible.

## User Value Proposition
- Consistent, reviewable planning before implementation (Specs cadence and approvals).
- One‑click execution of individual tasks from `tasks.md` with automatic check‑off.
- Centralized, discoverable guidance (Steering) that shapes AI behavior per project.
- Quick exploratory conversations with Codex in the Chat view without leaving VS Code.

## Business Logic Rules (follow strictly)
- Paths come from `ConfigManager.getPath(...)` and default to `DEFAULT_CONFIG.paths` (see `src/constants.ts`, `src/utils/config-manager.ts`). Never hardcode absolute paths.
- Create directories/files inside `.codex/` only when missing; do not overwrite user content.
- Gate disabled features by flags in `src/constants.ts`:
  - `ENABLE_SPEC_AGENTS`, `ENABLE_AGENTS_UI`, `ENABLE_HOOKS_UI`, `ENABLE_MCP_UI` must be respected in UI and command registration.
- Require Codex CLI readiness before actions that invoke it; surface `showSetupGuidance` on failure (`src/providers/codex-provider.ts`).
- Keep the Spec order: generate Requirements → approval → Design → approval → Tasks. In navigation, show placeholder docs with guidance if files are absent (`SpecManager.navigateToDocument`).
- Write task completion as Markdown checkbox replacement `- [ ]` → `- [x]` when executing a task (`kiroCodex.spec.implTask`).
- Maintain `.codex` watcher‑based auto‑refresh of tree views; avoid long‑running synchronous work on the extension host thread.

## Examples
- Spec base path resolution: `SpecManager.getSpecBasePath()` returns `.codex/specs` by default.
- Steering generation entry: `kiroCodex.steering.generateInitial` uses `src/prompts/target/steering/init-steering.ts` through `PromptLoader`.
- Packaging is extension‑first; the extension bundle is built with esbuild, webview assets with Vite, then packaged with `vsce`. CLIs are invoked via terminal using `CommandBuilder`.
