# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-09-07

Initial public release.

### ✨ New Features

- SPEC management:
  - Create specs (requirements → design → tasks) via Codex CLI (`kfc.spec.create`).
  - Navigate to requirements/design/tasks from the SPEC explorer.
  - CodeLens for tasks in `tasks.md`: execute a single task via Codex and auto‑check it off (`kfc.spec.implTask`).
- STEERING management:
  - Generate initial project steering docs (product/tech/structure) (`kfc.steering.generateInitial`).
  - Create custom steering documents (`kfc.steering.create`).
  - Refine and delete steering docs with Codex updating related docs (`kfc.steering.refine`, `kfc.steering.delete`).
- PROMPTS view:
  - Create Markdown prompts under `.codex/prompts` (`kfc.prompts.create`).
  - Run prompts in a split terminal with Codex (`kfc.prompts.run`).
  - Refresh prompts list (`kfc.prompts.refresh`).
- Overview/Settings:
  - Optional settings view and quick links (`kfc.settings.open`, `kfc.help.open`).
  - Toggle view visibility from a command (`kfc.menu.open`).
- Codex integration:
  - Availability/version check and setup guidance (`kfc.codex.checkAvailability`).
  - Headless execution and split‑terminal invocation with retry/error handling.
- Update checker:
  - Manual update check command (`kfc.checkForUpdates`).

### 🔧 Improvements

- Default settings include prompts path (`paths.prompts`) and visibility (`views.prompts`).
- File system watchers auto‑refresh SPEC/STEERING/PROMPTS on `.codex/` changes.
- Windows enhancements: WSL path conversion when detected; PowerShell recommended.

### 🚫 Temporarily Disabled / Limitations

- Agents, Hooks, and MCP views are disabled in this build.
- "New Spec with Agents" flow is disabled.
