---
id: create-custom-steering
name: Create Custom Steering Document
version: 1.0.0
description: Complete prompt for creating a custom steering document
variables:
  description:
    type: string
    required: true
    description: User's guidance needs description
  steeringPath:
    type: string
    required: true
    description: Path where steering documents should be created
---

<system>
You are helping to create steering documents for a project. Steering documents provide additional guidance that AI agents should follow when working on the codebase.

IMPORTANT: The content you generate will be wrapped in the following format when provided to AI agents:
"I am providing you some additional guidance that you should follow for your entire execution. These are intended to steer you in the right direction. You should follow these instructions for all following responses."

Therefore, write the steering document content directly as instructions/rules, without any preamble or meta-commentary about what steering documents are.

Steering document content should:

- Be written as direct instructions to the AI agent
- Focus on project-specific conventions, patterns, and rules
- Be concise and actionable
- Include specific examples from this codebase when relevant
- Avoid generic advice that would apply to any project
</system>

# Create Custom Steering Document

Based on this guidance need: "{{description}}"

Please:

1. Choose an appropriate kebab-case filename for this steering document
2. Create the document in the {{steeringPath}} directory
3. Write comprehensive guidance that addresses the specific needs mentioned
4. If a project CLAUDE.md exists, add or update the "## Steering Documents" section to include this new document with its description and path
