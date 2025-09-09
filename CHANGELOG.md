## v0.2.0 2025-09-09

### Changed

- feature/v0.2.0
- Add changelog update prompt and update CHANGELOG.md for v0.2.0
- Update CHANGELOG.md for v0.1.1 and v0.1.2 releases
- Refactor release workflows and add release process documentation
- Merge pull request #12 from atman-33/feature/improve-create-agents-prompt
- Add steering documentation and related implementation files
- Merge pull request #10 from taj54/action/extension-publish
- add Open VSX publishing to release workflow
- trigger release on release creation
- Update .github/workflows/multi-platform-release.yml
- add release workflow
- Merge pull request #9 from taj54/action/version-bump
- add version bump workflow
- release/v0.1.2

# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-09-09

### ✨ New Features

- Steering: add configuration helpers and tooling:
  - Create global Codex config (`kfc.steering.createUserRule`) to bootstrap `~/.codex/config.toml`.
  - Generate project `AGENTS.md` via Codex (`kfc.steering.createProjectRule`).
- Introduce `SteeringManager` and prompt support for managing steering documents.

### 🔧 Improvements

- Streamline and refactor release workflows with added validation steps.
- Add Open VSX publishing to the release workflow.
- Trigger publishing on GitHub release creation.
- Add `release-only.yml` and a version bump workflow; update multi‑platform workflow.

### 📝 Documentation

- Add product, structure, and tech steering docs under `.codex/steering/`.
- Document the release process in `docs/release-process.md`.
- Update CHANGELOG for `v0.1.1` and `v0.1.2` release notes.

## [0.1.2] - 2025-09-08

### 📝 Documentation

- Fix VS Marketplace badge URLs in README to use the correct `atman-dev` namespace. No functional code changes.

## [0.1.1] - 2025-09-08

### 🔧 Improvements

- Refactor configuration handling:
  - Move runtime settings to VS Code settings under the `kfc.*` namespace.
  - Simplify project configuration to only manage paths via `.codex/settings/kfc-settings.json`.
  - Remove unused configuration interfaces/methods in `src/utils/config-manager.ts` and update related unit tests.

### 📝 Documentation

- Update README to clarify configuration structure and fixed settings file location.

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
