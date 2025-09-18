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
---

<system>
You are generating AGENTS.md for this repository.

CRITICAL CONSTRAINTS (do not violate):
- Do NOT duplicate or restate content from files under "{{steeringPath}}" (product.md, tech.md, structure.md). Reference them instead.
- Do NOT include explicit numeric/version values pulled from code (e.g., the actual value of MIN_CODEX_CLI_VERSION). Reference identifiers/locations only.
- Keep AGENTS.md concise, scan-friendly, and machine-parseable. Prefer short sections with bullets over narrative.
- Treat Steering docs as authoritative for product/tech/structure decisions. AGENTS.md is an index and contract, not a duplicate.

DECISION PRECEDENCE (must be included as-is):
1) Steering documents under "{{steeringPath}}/*.md"
2) This AGENTS.md contract (general repository conventions)
3) Generic assumptions (avoid unless explicitly allowed)

STYLE:
- Use imperative bullets ("Use X", "Avoid Y").
- Keep it reference-first: link or name the file and section, don’t restate content.
- Avoid generic best practices unless needed to glue rules together.
</system>

# AGENTS.md Contract

This file defines the agent contract and serves as the index to project guidance. It applies repo-wide unless overridden by a nested AGENTS.md.

## Steering Documents
- Purpose: Treat Steering as the first-party source for product, technical, and structural guidance.
- Location: "{{steeringPath}}/product.md", "{{steeringPath}}/tech.md", "{{steeringPath}}/structure.md".
- Access: Use repository-provided helpers to resolve paths; avoid hardcoded absolutes.
- Mutations: Treat Steering as read-only; follow the established change-management flow instead of ad-hoc edits.
- Usage: Summarize applicable Steering points in outputs; cite the specific file/section without restating details.

## Decision Precedence
1) Steering documents under "{{steeringPath}}/*.md".
2) This AGENTS.md contract (general repository conventions).
3) Generic assumptions (avoid unless explicitly allowed).

## Agent Behavior Contract
- Prefer project-provided abstractions for CLI operations; avoid ad-hoc process spawning when wrappers exist.
- Respect feature flags and configuration gating documented in Steering or related code references.
- Logging: Use the shared logging utilities; record key lifecycle and error paths without excess noise.
- Error handling: Route failures through centralized services/utilities rather than ad-hoc try/catch loops.
- Performance/UX: Honor project guidelines for long-running work so the host environment remains responsive.
- Reference Steering for specifics (naming, boundaries, directory layout) rather than restating them here.

## Paths & I/O
- Workspace I/O: Prefer project-sanctioned file system helpers for read/write/create operations.
- Path resolution: Use repository-approved path utilities for "{{steeringPath}}" and related directories; avoid absolute paths.
- Write boundaries: Only modify files within approved workspace areas defined by project rules.
- Steering: Do not overwrite files under `{{steeringPath}}` directly; rely on the sanctioned update flow.

## CLI Integration
- Build CLI commands through officially supported builders/wrappers before execution.
- Approval modes and model flags: Reference their definition sites/tests without duplicating values.
- Verify required tooling availability before invocation; surface setup guidance if unavailable.

## Submission Checklist (For Agents)
- Verified decisions against `{{steeringPath}}/*.md`; cited files/sections without duplication.
- Resolved steering paths via approved utilities; avoided absolute paths.
- Respected feature flags and constraints documented by the project.
- Used project-sanctioned wrappers for CLI interactions.
- Avoided restating Steering or code constants; kept AGENTS.md concise and index-like.

## Non‑Goals / Anti‑Patterns
- Do not bypass official wrappers/utilities for CLI calls when they exist.
- Do not store state in globals beyond established singletons.
- Do not write outside approved directories or overwrite Steering directly.
- Do not re-enable disabled features unless explicitly requested.

## Instructions to Apply
- Write or update `AGENTS.md` at the repository root with the structure above.
- If an AGENTS.md already exists, update it in-place to conform to this reference-first contract without duplicating Steering content.
