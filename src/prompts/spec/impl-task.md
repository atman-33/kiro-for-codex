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

1. Review the requirements and design documents in the spec folder
2. Implement this task based on existing codebase patterns and conventions
3. Ensure code quality, including error handling, performance, and security
4. Add comprehensive unit tests for the implemented code

Let's start implementing this task!
</user_input>
