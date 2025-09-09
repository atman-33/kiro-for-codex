# AGENTS.md — Kiro for Codex

This file defines the agent contract and serves as the index to project guidance. It applies repo‑wide unless overridden by a nested `AGENTS.md`.

## Steering Documents
- Use Steering as the authoritative source for product, technical, and structural guidance.
- Location: `.codex/steering/product.md`, `.codex/steering/tech.md`, `.codex/steering/structure.md`.
- Access: Resolve paths via `ConfigManager` (e.g., `ConfigManager.getPath('steering')`). Do not hardcode absolute paths.
- Mutations: Treat Steering as read‑only; perform changes only via feature flows (Init/Refine/Delete), not ad‑hoc edits.
- Usage: When producing outputs, summarize applicable Steering points and cite the specific file/section; do not restate content verbatim.

## Decision Precedence
1) Code-level flags and constraints in "src/constants.ts"
2) Steering documents under ".codex/steering/*.md"
3) This AGENTS.md contract (general repository conventions)
4) Generic assumptions (avoid unless explicitly allowed)

## Agent Behavior Contract
- Use `CodexProvider` for CLI operations; build commands with `CommandBuilder`; execute via `ProcessManager`. Do not spawn child processes directly.
- Respect feature flags and constraints in `src/constants.ts` and any `package.json` `contributes.*` gating.
- Logging: Use the shared OutputChannel; log key lifecycle and error paths; avoid noisy logs.
- Error handling: Use centralized services (`ErrorHandler`, `RetryService`); avoid ad‑hoc try/catch loops.
- Performance/UX: Do not block the extension host; for long tasks use split terminals and VS Code progress notifications.
- Reference Steering for naming, boundaries, and directory layout instead of restating rules here.

## Paths & I/O
- Workspace I/O: Prefer VS Code FS APIs (`vscode.workspace.fs`) for read/write/create.
- Path resolution: Use `ConfigManager` for all `.codex/**` paths; avoid absolute paths.
- Write boundaries: Only write within `.codex/**`, the workspace, or VS Code storage as allowed by project rules.
- Steering: Do not overwrite files under `.codex/steering` directly; use feature flows.

## CLI Integration
- Build CLI arguments with `CommandBuilder`; execute via `ProcessManager`.
- Approval modes and model flags: Reference their definition sites/tests; do not duplicate explicit values.
- Verify Codex availability via `CodexProvider` before invocation; surface setup guidance if unavailable.

## Submission Checklist (For Agents)
- Verified decisions against `.codex/steering/*.md`; cited files/sections without duplication.
- Resolved steering path via `ConfigManager`; avoided absolute paths.
- Respected feature flags and constraints in `src/constants.ts`.
- Used `CodexProvider`/`CommandBuilder`/`ProcessManager` for CLI interactions.
- Kept outputs reference‑first; avoided restating Steering or code constants.

## Non‑Goals / Anti‑Patterns
- Do not bypass `CodexProvider`/`ProcessManager` for CLI calls.
- Do not store state in globals beyond established singletons.
- Do not write outside approved directories or overwrite Steering directly.
- Do not re‑enable disabled features unless explicitly requested.

## Instructions to Apply
- Maintain this file at the repository root.
- If a nested `AGENTS.md` exists, it overrides within its subtree; keep content consistent with Decision Precedence and reference Steering instead of duplicating it.

