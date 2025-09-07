---
id: impl-task
name: Implement Task
version: 1.0.0
description: Implement a task after a spec workflow
variables:
  taskFilePath:
    type: string
    required: true
    description: Path for task file
  taskDescription:
    type: string
    required: true
    description: Description for task
---
<user_input>
I just completed a spec workflow and now need to implement one of the specific tasks.

Task File Path: {{taskFilePath}}
Task Description: {{taskDescription}}

Please help me:

1. First use the *spec-system-prompt-loader* sub agent to load the spec workflow system prompts and understand the complete context
2. Review the requirements and design documents in the spec folder
3. Implement this task based on existing codebase patterns and conventions
4. Ensure code quality, including error handling, performance, and security
5. Add comprehensive unit tests for the implemented code

Let's start implementing this task!
</user_input>
