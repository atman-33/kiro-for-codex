// Auto-generated from src/prompts/steering/create-agents-md.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "create-agents-md",
  "name": "Create or Update AGENTS.md (Reference-First)",
  "version": "1.0.0",
  "description": "Generate a non-duplicative, reference-first AGENTS.md that indexes Steering docs and defines the agent contract.",
  "variables": {
    "steeringPath": {
      "type": "string",
      "required": true,
      "description": "Path (relative to workspace) where steering documents are stored"
    },
    "constantsPath": {
      "type": "string",
      "required": true,
      "description": "Relative path to the code-level constants file (e.g., src/constants.ts)"
    }
  }
};

export const content = "\n<system>\nYou are generating AGENTS.md for this repository.\n\nCRITICAL CONSTRAINTS (do not violate):\n- Do NOT duplicate or restate content from files under \"{{steeringPath}}\" (product.md, tech.md, structure.md). Reference them instead.\n- Do NOT include explicit numeric/version values pulled from code (e.g., the actual value of MIN_CODEX_CLI_VERSION). Reference identifiers/locations only.\n- Keep AGENTS.md concise, scan-friendly, and machine-parseable. Prefer short sections with bullets over narrative.\n- Treat Steering docs as authoritative for product/tech/structure decisions. AGENTS.md is an index and contract, not a duplicate.\n\nDECISION PRECEDENCE (must be included as-is):\n1) Code-level flags and constraints in \"{{constantsPath}}\"\n2) Steering documents under \"{{steeringPath}}/*.md\"\n3) This AGENTS.md contract (general repository conventions)\n4) Generic assumptions (avoid unless explicitly allowed)\n\nSTYLE:\n- Use imperative bullets (\"Use X\", \"Avoid Y\").\n- Keep it reference-first: link or name the file and section, don’t restate content.\n- Avoid generic best practices unless needed to glue rules together.\n</system>\n\n# AGENTS.md — Kiro for Codex\n\nThis file defines the agent contract and serves as the index to project guidance. It applies repo-wide unless overridden by a nested AGENTS.md.\n\n## Steering Documents\n- Purpose: Treat Steering as the first-party source for product, technical, and structural guidance.\n- Location: \"{{steeringPath}}/product.md\", \"{{steeringPath}}/tech.md\", \"{{steeringPath}}/structure.md\".\n- Access: Resolve paths via ConfigManager (e.g., `ConfigManager.getPath('steering')`). Never hardcode absolute paths.\n- Mutations: Treat Steering as read-only; update via feature flows (Init/Refine/Delete) rather than ad-hoc edits.\n- Usage: Summarize applicable Steering points in outputs; cite the specific file/section without restating details.\n\n## Decision Precedence\n1) Code-level flags and constraints in \"{{constantsPath}}\".\n2) Steering documents under \"{{steeringPath}}/*.md\".\n3) This AGENTS.md contract (general repository conventions).\n4) Generic assumptions (avoid unless explicitly allowed).\n\n## Agent Behavior Contract\n- Prefer CodexProvider for CLI operations; use ProcessManager/CommandBuilder; never spawn child processes directly.\n- Respect feature flags in \"{{constantsPath}}\" and any `package.json` `contributes.*` gating.\n- Logging: Use the shared OutputChannel; log key lifecycle and error paths; avoid noisy logs.\n- Error handling: Use centralized services (ErrorHandler/RetryService); avoid ad-hoc try/catch loops.\n- Performance/UX: Do not block the extension host; long tasks use split terminals and VS Code progress notifications.\n- Reference Steering for specifics (naming, boundaries, directory layout) rather than restating them here.\n\n## Paths & I/O\n- Workspace I/O: Prefer VS Code FS APIs (`vscode.workspace.fs`) for read/write/create.\n- Path resolution: Use ConfigManager for all `.codex/*` paths; avoid absolute paths.\n- Write boundaries: Only write within `.codex/**`, the workspace, or VS Code storage as allowed by project rules.\n- Steering: Do not overwrite files under `{{steeringPath}}` directly; use feature flows.\n\n## CLI Integration\n- Build CLI arguments with CommandBuilder; execute via ProcessManager.\n- Approval modes and model flags: Reference their definition sites/tests without duplicating values.\n- Verify Codex availability before invocation; surface setup guidance if unavailable.\n\n## Submission Checklist (For Agents)\n- Verified decisions against `{{steeringPath}}/*.md`; cited files/sections without duplication.\n- Resolved steering path via ConfigManager; avoided absolute paths.\n- Respected feature flags and constraints in `{{constantsPath}}`.\n- Used CodexProvider/CommandBuilder/ProcessManager for CLI interactions.\n- Avoided restating Steering or code constants; kept AGENTS.md concise and index-like.\n\n## Non‑Goals / Anti‑Patterns\n- Do not bypass CodexProvider/ProcessManager for CLI calls.\n- Do not store state in globals beyond established singletons.\n- Do not write outside approved directories or overwrite Steering directly.\n- Do not re-enable disabled features unless explicitly requested.\n\n## Instructions to Apply\n- Write or update `AGENTS.md` at the repository root with the structure above.\n- If an AGENTS.md already exists, update it in-place to conform to this reference-first contract without duplicating Steering content.\n\n";

export default {
  frontmatter,
  content
};
