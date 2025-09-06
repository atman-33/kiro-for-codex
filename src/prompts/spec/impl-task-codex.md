---
id: impl-task-codex
name: Implement Task with Codex CLI
version: 1.0.0
description: Codex-optimized prompt for implementing specific tasks from a spec
variables:
  taskFilePath:
    type: string
    required: true
    description: Path to the task file
  taskDescription:
    type: string
    required: true
    description: Description of the task to implement
  approvalMode:
    type: string
    required: false
    default: "interactive"
    description: Codex CLI approval mode
  workingDirectory:
    type: string
    required: false
    description: Working directory for the task
---

# Task: Implement Specification Task

## Context
You are implementing a specific task from a feature specification using Codex CLI. This task is part of a larger implementation plan and should integrate seamlessly with existing code.

**Task File:** {{taskFilePath}}
**Working Directory:** {{workingDirectory}}
**Approval Mode:** {{approvalMode}}

## Task Description
{{taskDescription}}

## Expected Output
- Functional code implementation
- Unit tests for the implemented functionality
- Updated task status in the task file
- Integration with existing codebase

## Constraints
- Follow existing project conventions and patterns
- Ensure code is well-documented with clear comments
- Implement comprehensive error handling
- Use TypeScript best practices
- Maintain backward compatibility
- Focus only on the specified task scope

## Codex CLI Implementation Guidelines

### Code Quality Standards
- Use descriptive variable and function names
- Include JSDoc comments for public APIs
- Follow consistent indentation and formatting
- Implement proper error boundaries
- Add logging for debugging purposes

### Testing Requirements
- Write unit tests for all new functionality
- Use existing test frameworks and patterns
- Achieve meaningful test coverage
- Include edge case testing
- Mock external dependencies appropriately

### Integration Approach
- Review existing codebase patterns before implementing
- Ensure new code follows established architecture
- Update relevant interfaces and types
- Maintain consistency with naming conventions
- Consider impact on other components

## Approval Mode Specific Instructions

### Interactive Mode
- Implement code incrementally
- Provide clear explanations for each step
- Allow for review and feedback at key points
- Show intermediate results and progress

### Auto-Edit Mode
- Implement complete functionality in focused chunks
- Ensure each edit is self-contained and functional
- Minimize the number of file modifications needed
- Provide clear commit-ready changes

### Full-Auto Mode
- Implement the entire task in one comprehensive pass
- Include all necessary files, tests, and documentation
- Ensure the implementation is production-ready
- Handle all edge cases and error scenarios

## Implementation Steps

1. **Analysis Phase**
   - Read and understand the requirements document
   - Review the design document for architectural context
   - Examine the specific task requirements and constraints
   - Identify dependencies and integration points

2. **Planning Phase**
   - Determine files that need to be created or modified
   - Plan the implementation approach
   - Identify potential risks and mitigation strategies
   - Outline testing strategy

3. **Implementation Phase**
   - Create or modify necessary files
   - Implement core functionality
   - Add comprehensive error handling
   - Write unit tests
   - Update documentation as needed

4. **Validation Phase**
   - Run tests to ensure functionality works correctly
   - Verify integration with existing code
   - Check for any breaking changes
   - Update task status to completed

## Success Criteria
- Task is fully implemented according to specifications
- All tests pass successfully
- Code follows project conventions and quality standards
- Integration with existing codebase is seamless
- Task is marked as completed in the task file
- No breaking changes to existing functionality

Begin implementation by analyzing the specification documents and understanding the task context.