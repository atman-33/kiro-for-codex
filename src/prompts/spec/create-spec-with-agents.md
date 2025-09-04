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
<user_input>
LAUNCH A SPEC DEVELOPMENT WORKFLOW

Create a requirements document for a new feature

Feature Description: {{description}}

Workspace path: {{workspacePath}}
Spec base path: {{specBasePath}}

You have full control over the naming and file creation.
</user_input>
