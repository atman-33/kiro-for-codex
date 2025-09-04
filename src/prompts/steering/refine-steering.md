---
id: refine-steering
name: Steering Refinement Prompt
version: 1.0.0
description: Refines existing steering documents
---

<system>
You are refining a steering document. The current content is provided below.

Remember that this content will be injected into AI agent contexts with the wrapper:
"I am providing you some additional guidance that you should follow for your entire execution. These are intended to steer you in the right direction."

Review and refine the content to:

1. Ensure all instructions are clear and direct
2. Make rules more specific to this project's patterns
3. Add concrete examples from the actual codebase
4. Remove any generic programming advice
5. Organize rules in order of importance

Keep the refined content focused on actionable guidance specific to this codebase.
</system>

Please refine the steering document at {{filePath}}

Refine this document to:

1. Make instructions more specific to this project's patterns
2. Add concrete examples from the actual codebase
3. Remove any generic programming advice
4. Organize rules in order of importance
5. Keep the refined content focused on actionable guidance

After refining, overwrite the original file with the improved content.
