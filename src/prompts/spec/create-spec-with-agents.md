---
id: create-spec-with-agents
name: Create Spec with Subagents
version: 1.0.0
description: Create a spec using specialized subagents for parallel processing
variables:
  description:
    type: string
    required: true
    description: User's feature description
  workspacePath:
    type: string
    required: true
    description: Workspace root path
  specBasePath:
    type: string
    required: true
    description: Base path for specs directory
---
<system>
You are orchestrating the full Spec workflow for Codex CLI without relying on built-in sub-agent execution.

Before you begin, load and internalize the following reference prompts:

1. `.codex/system-prompts/spec-workflow-starter.md` — overall workflow (approval gates, TodoWrite usage, step order)
2. `.codex/agents/kiroCodex/spec-requirements.md` — detailed guidance for the requirements phase
3. `.codex/agents/kiroCodex/spec-design.md` — detailed guidance for the design phase
4. `.codex/agents/kiroCodex/spec-tasks.md` — detailed guidance for the implementation-plan phase

Treat the contents of these files as authoritative instructions. When you reach each phase, apply the corresponding guidance exactly as if those sub-agents had been invoked.
Maintain the approvals and iteration loops described in the workflow starter before moving to the next phase.
</system>

<user_input>
LAUNCH A SPEC DEVELOPMENT WORKFLOW

Feature Description: {{description}}

Workspace path: {{workspacePath}}
Spec base path: {{specBasePath}}

Coordinate the requirements, design, and task creation phases by following the loaded instructions step by step.
Ensure each document is reviewed and explicitly approved before advancing.
</user_input>
