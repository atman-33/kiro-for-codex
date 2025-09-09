---
id: create-agents-md
name: Create or Update AGENTS.md (Reference-First)
version: 1.0.0
description: Generate a non-duplicative, reference-first AGENTS.md that indexes Steering docs and defines the agent contract.
variables:
  steeringPath:
    type: string
    required: true
    description: Path (relative to workspace) where steering documents are stored
  constantsPath:
    type: string
    required: true
    description: Relative path to the code-level constants file (e.g., src/constants.ts)
---

<system>
You are generating AGENTS.md for this repository.

CRITICAL CONSTRAINTS (do not violate):
- Do NOT duplicate or restate content from files under "{{steeringPath}}" (product.md, tech.md, structure.md). Reference them instead.
- Do NOT include explicit numeric/version values pulled from code (e.g., the actual value of MIN_CODEX_CLI_VERSION). Reference identifiers/locations only.
- Keep AGENTS.md concise, scan-friendly, and machine-parseable. Prefer short sections with bullets over narrative.
- Treat Steering docs as authoritative for product/tech/structure decisions. AGENTS.md is an index and contract, not a duplicate.

DECISION PRECEDENCE (must be included as-is):
1) Code-level flags and constraints in "{{constantsPath}}"
2) Steering documents under "{{steeringPath}}/*.md"
3) This AGENTS.md contract (general repository conventions)
4) Generic assumptions (avoid unless explicitly allowed)

STYLE:
- Use imperative bullets ("Use X", "Avoid Y").
- Keep it reference-first: link or name the file and section, don’t restate content.
- Avoid generic best practices unless needed to glue rules together.
</system>

# AGENTS.md — Kiro for Codex

This file defines the agent contract and serves as the index to project guidance. It applies repo-wide unless overridden by a nested AGENTS.md.

## Steering Documents
- Purpose: Treat Steering as the first-party source for product, technical, and structural guidance.
- Location: "{{steeringPath}}/product.md", "{{steeringPath}}/tech.md", "{{steeringPath}}/structure.md".
- Access: Resolve paths via ConfigManager (e.g., `ConfigManager.getPath('steering')`). Never hardcode absolute paths.
- Mutations: Treat Steering as read-only; update via feature flows (Init/Refine/Delete) rather than ad-hoc edits.
- Usage: Summarize applicable Steering points in outputs; cite the specific file/section without restating details.

## Decision Precedence
1) Code-level flags and constraints in "{{constantsPath}}".
2) Steering documents under "{{steeringPath}}/*.md".
3) This AGENTS.md contract (general repository conventions).
4) Generic assumptions (avoid unless explicitly allowed).

## Agent Behavior Contract
- Prefer CodexProvider for CLI operations; use ProcessManager/CommandBuilder; never spawn child processes directly.
- Respect feature flags in "{{constantsPath}}" and any `package.json` `contributes.*` gating.
- Logging: Use the shared OutputChannel; log key lifecycle and error paths; avoid noisy logs.
- Error handling: Use centralized services (ErrorHandler/RetryService); avoid ad-hoc try/catch loops.
- Performance/UX: Do not block the extension host; long tasks use split terminals and VS Code progress notifications.
- Reference Steering for specifics (naming, boundaries, directory layout) rather than restating them here.

## Paths & I/O
- Workspace I/O: Prefer VS Code FS APIs (`vscode.workspace.fs`) for read/write/create.
- Path resolution: Use ConfigManager for all `.codex/*` paths; avoid absolute paths.
- Write boundaries: Only write within `.codex/**`, the workspace, or VS Code storage as allowed by project rules.
- Steering: Do not overwrite files under `{{steeringPath}}` directly; use feature flows.

## CLI Integration
- Build CLI arguments with CommandBuilder; execute via ProcessManager.
- Approval modes and model flags: Reference their definition sites/tests without duplicating values.
- Verify Codex availability before invocation; surface setup guidance if unavailable.

## Submission Checklist (For Agents)
- Verified decisions against `{{steeringPath}}/*.md`; cited files/sections without duplication.
- Resolved steering path via ConfigManager; avoided absolute paths.
- Respected feature flags and constraints in `{{constantsPath}}`.
- Used CodexProvider/CommandBuilder/ProcessManager for CLI interactions.
- Avoided restating Steering or code constants; kept AGENTS.md concise and index-like.

## Non‑Goals / Anti‑Patterns
- Do not bypass CodexProvider/ProcessManager for CLI calls.
- Do not store state in globals beyond established singletons.
- Do not write outside approved directories or overwrite Steering directly.
- Do not re-enable disabled features unless explicitly requested.

## Instructions to Apply
- Write or update `AGENTS.md` at the repository root with the structure above.
- If an AGENTS.md already exists, update it in-place to conform to this reference-first contract without duplicating Steering content.

