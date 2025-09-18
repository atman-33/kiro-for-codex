# 📦 Changelog for Kiro for Codex

All notable changes to this project will be documented in this file.

---

## v0.5.1 2025-09-18

### Added

- update AGENTS.md contract with clearer guidance

### Changed

- feature/improve-create-agent-config
- bug-fix/release-only-workflow
- bug-fix/release-only-workflow
- feature/fix-workflows
- improve release workflow with tag existence check and dispatch
- Merge pull request #38 from atman-33/version-bump/v0.5.0

### Fixed

- add tag_name to GitHub release workflow
- add actions write permission to release workflow

## v0.5.0 2025-09-17

### Added

- add Windows shell path configuration for Codex commands
- simplify filename to camelCase conversion
- add .gitattributes and bump version to 0.4.0

### Changed

- feature/update-readme
- add Windows shell path override configuration
- feature/improve-github-workflows
- update version bump workflow and release docs
- feature/select-terminal
- feature/improve-build-prompts

## v0.4.0 2025-09-15

### Added

- add new purple Kiro SVG and update icon assets
- update prompts explorer icon and path display
- adjust padding-top in chat view layout
- update dependencies and vscodeignore patterns

### Changed

- Merge pull request #31 from atman-33/feature/misc-updates
- update GitHub Actions and Husky pre-commit hook
- enhance documentation with new features and updates for Create New Spec and Chat UI
- Refactor build process and update ignore files
- Remove GEMINI.md and update .gitignore to exclude it
- Refactor background styling to use global CSS variables
- Rename KFC references to KiroCodex across codebase
- Refactor agent manager with consistent formatting and naming
- Bump version to 0.3.0 and add UI extension support
- Merge branch 'main' into develop
- feature/webview
- Update vscode mocks in codex-provider tests for better coverage
- Add lucide-react dependency for icon support
- Optimize GitHub workflows with Node.js caching and webview-ui support
- Refactor create spec UI with improved submission flow
- Add reusable PillButton component and update chat header
- Add IconButton component and refactor action buttons
- Refactor composer to use reusable TextareaPanel component
- Refactor chat composer styling and layout
- Add .serena to gitignore
- Add Create New Spec UI panel and streamline spec creation flow
- Add `--` separator to prevent subcommand interpretation
- Improve terminal placement logic in CodexProvider
- Adjust chat UI styling and remove status indicator
- Refactor chat composer and add header component
- Refactor codex-chat to features directory and rename components
- Add terminal session management for Codex chat interactions
- Remove Codex Chat panel preview feature
- Add Tailwind CSS support and optimize webview resource loading
- Refactor layout styles and add CSS file
- Remove repomix-output.xml and update gitignore
- Add chat view provider and webview UI components for Codex chat
- Refactor file structure and rename components for codex-chat feature
- Implement streaming execution for chat responses
- Refactor codebase and update Biome configuration
- Implement chat manager for Codex Chat with runOnce functionality
- Implement basic chat IPC with echo functionality
- Add webview UI and update dependencies for extension
- feature/update-docs
- Update build system from Webpack to Vite and document changes
- feature/refactor-config
- Update Vite config to improve build output cleanliness
- Merge pull request #23 from atman-33/feature/biome
- Merge branch 'develop' into feature/biome
- Merge pull request #24 from atman-33/21-migrate-build-and-test-stack-webpack-jest-vite-vitest
- Refactor test imports and mock types for consistency
- Remove Vite/Vitest migration docs and update test files
- 'compat' to Vite build config for CJS output
- Update documentation and scripts for Vite/Vitest migration
- Remove legacy Webpack and Jest configurations
- Update CI workflows and build config for Vite/Vitest migration
- Refactor build scripts to use Vite exclusively
- Mark task 6 as complete in Vite-Vitest migration checklist
- Update test README to reflect Vitest snapshot usage
- Update test suites to use Vitest instead of Jest
- Add Husky pre-commit hook with Biome linting
- Add Biome.js configuration and update to v0.2.0
- add scripts and migrate test files
- Implement initial Vite/Vitest setup and configuration
- Add Vite config for SSR build and mark task complete
- Add Vite and Vitest dependencies for migration
- Add Vite/Vitest migration design and spec documents

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
