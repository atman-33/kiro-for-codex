# 📦 Changelog for Kiro for Codex

All notable changes to this project will be documented in this file.

---

## v0.3.0 2025-09-15

### Breaking

- Rename internal namespace from `kfc` to `kiroCodex` to avoid collisions with the original extension and make the identifier explicit.
  - Commands: `kfc.*` → `kiroCodex.*`
  - Views and container IDs: `kfc.views.*` → `kiroCodex.views.*`
  - Settings namespace: `kfc.*` → `kiroCodex.*`
  - Project settings file: `.codex/settings/kfc-settings.json` → `.codex/settings/kiroCodex-settings.json`
  - Built-in agents directory: `.codex/agents/kfc` → `.codex/agents/kiroCodex`

### Changed

- Merge pull request #28 from cbruyndoncx/fix-naming-conflict-rename-kfc-to-kiroCodex
- renamed kfc references in settings to kiroCodex to allow both Kiro Claude and Kiro Codex
- feature/issue-to-pr
- Add GitHub workflow for automated issue-to-PR with Codex
- Refactor AGENTS.md to focus on agent contract and steering docs
- Merge pull request #20 from atman-33/version-bump/v0.2.0

## v0.2.0 2025-09-09

### Changed

- bug-fix/changelog-workflow
- Refactor release workflows and remove changelog prompt
- bug-fix/verup-workflow
- Update version-bump workflow to target package.json version
- bug-fix/verup-workflow
- Fix GitHub Actions output syntax and improve package.json version read
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

## v0.1.2 2025-09-08

### 📝 Documentation

- Fix VS Marketplace badge URLs in README to use the correct `atman-dev` namespace. No functional code changes.

## v0.1.1 2025-09-08

### 🔧 Improvements

- Refactor configuration handling:
  - Move runtime settings to VS Code settings under the `kiroCodex.*` namespace.
  - Simplify project configuration to only manage paths via `.codex/settings/kiroCodex-settings.json`.
  - Remove unused configuration interfaces/methods in `src/utils/config-manager.ts` and update related unit tests.

### 📝 Documentation

- Update README to clarify configuration structure and fixed settings file location.

## v0.1.0 2025-09-07

Initial public release.

### ✨ New Features

- SPEC management:
  - Create specs (requirements → design → tasks) via Codex CLI (`kiroCodex.spec.create`).
  - Navigate to requirements/design/tasks from the SPEC explorer.
  - CodeLens for tasks in `tasks.md`: execute a single task via Codex and auto‑check it off (`kiroCodex.spec.implTask`).
- STEERING management:
  - Generate initial project steering docs (product/tech/structure) (`kiroCodex.steering.generateInitial`).
  - Create custom steering documents (`kiroCodex.steering.create`).
  - Refine and delete steering docs with Codex updating related docs (`kiroCodex.steering.refine`, `kiroCodex.steering.delete`).
- PROMPTS view:
  - Create Markdown prompts under `.codex/prompts` (`kiroCodex.prompts.create`).
  - Run prompts in a split terminal with Codex (`kiroCodex.prompts.run`).
  - Refresh prompts list (`kiroCodex.prompts.refresh`).
- Overview/Settings:
  - Optional settings view and quick links (`kiroCodex.settings.open`, `kiroCodex.help.open`).
  - Toggle view visibility from a command (`kiroCodex.menu.open`).
- Codex integration:
  - Availability/version check and setup guidance (`kiroCodex.codex.checkAvailability`).
  - Headless execution and split‑terminal invocation with retry/error handling.
- Update checker:
  - Manual update check command (`kiroCodex.checkForUpdates`).

### 🔧 Improvements

- Default settings include prompts path (`paths.prompts`) and visibility (`views.prompts`).
- File system watchers auto‑refresh SPEC/STEERING/PROMPTS on `.codex/` changes.
- Windows enhancements: WSL path conversion when detected; PowerShell recommended.

### 🚫 Temporarily Disabled / Limitations

- Agents, Hooks, and MCP views are disabled in this build.
- "New Spec with Agents" flow is disabled.
