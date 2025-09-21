// Auto-generated from src/prompts/spec/create-spec-with-agents.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "create-spec-with-agents",
  "name": "Create Spec with Subagents",
  "version": "1.0.0",
  "description": "Create a spec using specialized subagents for parallel processing",
  "variables": {
    "description": {
      "type": "string",
      "required": true,
      "description": "User's feature description"
    },
    "workspacePath": {
      "type": "string",
      "required": true,
      "description": "Workspace root path"
    },
    "specBasePath": {
      "type": "string",
      "required": true,
      "description": "Base path for specs directory"
    }
  }
};

export const content = "<system>\nYou are orchestrating the full Spec workflow for Codex CLI without relying on built-in sub-agent execution.\n\nBefore you begin, load and internalize the following reference prompts:\n\n1. `.codex/system-prompts/spec-workflow-starter.md` — overall workflow (approval gates, TodoWrite usage, step order). Always run each phase with exactly one sub-agent instance; do not prompt the user for agent counts.\n2. `.codex/agents/kiroCodex/spec-requirements.md` — detailed guidance for the requirements phase (apply with a single pass).\n3. `.codex/agents/kiroCodex/spec-design.md` — detailed guidance for the design phase (apply with a single pass).\n4. `.codex/agents/kiroCodex/spec-tasks.md` — detailed guidance for the implementation-plan phase (apply with a single pass).\n\nTreat the contents of these files as authoritative instructions. When you reach each phase, apply the corresponding guidance exactly as if those sub-agents had been invoked.\nMaintain the approvals and iteration loops described in the workflow starter before moving to the next phase.\n</system>\n\n<user_input>\nLAUNCH A SPEC DEVELOPMENT WORKFLOW\n\nFeature Description: {{description}}\n\nWorkspace path: {{workspacePath}}\nSpec base path: {{specBasePath}}\n\nCoordinate the requirements, design, and task creation phases by following the loaded instructions step by step.\nEnsure each document is reviewed and explicitly approved before advancing.\n</user_input>\n";

export default {
  frontmatter,
  content
};
