// Auto-generated from src/prompts/spec/impl-task-codex.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "impl-task-codex",
  "name": "Implement Task with Codex CLI",
  "version": "1.0.0",
  "description": "Codex-optimized prompt for implementing specific tasks from a spec",
  "variables": {
    "taskFilePath": {
      "type": "string",
      "required": true,
      "description": "Path to the task file"
    },
    "taskDescription": {
      "type": "string",
      "required": true,
      "description": "Description of the task to implement"
    },
    "approvalMode": {
      "type": "string",
      "required": false,
      "default": "interactive",
      "description": "Codex CLI approval mode"
    },
    "workingDirectory": {
      "type": "string",
      "required": false,
      "description": "Working directory for the task"
    }
  }
};

export const content = "\n# Task: Implement Specification Task\n\n## Context\nYou are implementing a specific task from a feature specification using Codex CLI. This task is part of a larger implementation plan and should integrate seamlessly with existing code.\n\n**Task File:** {{taskFilePath}}\n**Working Directory:** {{workingDirectory}}\n**Approval Mode:** {{approvalMode}}\n\n## Task Description\n{{taskDescription}}\n\n## Expected Output\n- Functional code implementation\n- Unit tests for the implemented functionality\n- Updated task status in the task file\n- Integration with existing codebase\n\n## Constraints\n- Follow existing project conventions and patterns\n- Ensure code is well-documented with clear comments\n- Implement comprehensive error handling\n- Use TypeScript best practices\n- Maintain backward compatibility\n- Focus only on the specified task scope\n\n## Codex CLI Implementation Guidelines\n\n### Code Quality Standards\n- Use descriptive variable and function names\n- Include JSDoc comments for public APIs\n- Follow consistent indentation and formatting\n- Implement proper error boundaries\n- Add logging for debugging purposes\n\n### Testing Requirements\n- Write unit tests for all new functionality\n- Use existing test frameworks and patterns\n- Achieve meaningful test coverage\n- Include edge case testing\n- Mock external dependencies appropriately\n\n### Integration Approach\n- Review existing codebase patterns before implementing\n- Ensure new code follows established architecture\n- Update relevant interfaces and types\n- Maintain consistency with naming conventions\n- Consider impact on other components\n\n## Approval Mode Specific Instructions\n\n### Interactive Mode\n- Implement code incrementally\n- Provide clear explanations for each step\n- Allow for review and feedback at key points\n- Show intermediate results and progress\n\n### Auto-Edit Mode\n- Implement complete functionality in focused chunks\n- Ensure each edit is self-contained and functional\n- Minimize the number of file modifications needed\n- Provide clear commit-ready changes\n\n### Full-Auto Mode\n- Implement the entire task in one comprehensive pass\n- Include all necessary files, tests, and documentation\n- Ensure the implementation is production-ready\n- Handle all edge cases and error scenarios\n\n## Implementation Steps\n\n1. **Analysis Phase**\n   - Read and understand the requirements document\n   - Review the design document for architectural context\n   - Examine the specific task requirements and constraints\n   - Identify dependencies and integration points\n\n2. **Planning Phase**\n   - Determine files that need to be created or modified\n   - Plan the implementation approach\n   - Identify potential risks and mitigation strategies\n   - Outline testing strategy\n\n3. **Implementation Phase**\n   - Create or modify necessary files\n   - Implement core functionality\n   - Add comprehensive error handling\n   - Write unit tests\n   - Update documentation as needed\n\n4. **Validation Phase**\n   - Run tests to ensure functionality works correctly\n   - Verify integration with existing code\n   - Check for any breaking changes\n   - Update task status to completed\n\n## Success Criteria\n- Task is fully implemented according to specifications\n- All tests pass successfully\n- Code follows project conventions and quality standards\n- Integration with existing codebase is seamless\n- Task is marked as completed in the task file\n- No breaking changes to existing functionality\n\nBegin implementation by analyzing the specification documents and understanding the task context.";

export default {
  frontmatter,
  content
};
