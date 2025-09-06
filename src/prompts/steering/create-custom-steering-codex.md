---
id: create-custom-steering-codex
name: Create Custom Steering Document for Codex CLI
version: 1.0.0
description: Codex-optimized prompt for creating custom steering documents
variables:
  description:
    type: string
    required: true
    description: User's guidance needs description
  steeringPath:
    type: string
    required: true
    description: Path where steering documents should be created
  approvalMode:
    type: string
    required: false
    default: "interactive"
    description: Codex CLI approval mode
---

# Task: Create Custom Steering Document

## Context
You are creating a steering document that will guide Codex CLI when working on this codebase. Steering documents provide project-specific instructions that ensure consistent code quality and adherence to established patterns.

**Steering Path:** {{steeringPath}}
**Approval Mode:** {{approvalMode}}

## Guidance Requirements
{{description}}

## Expected Output
A comprehensive steering document that provides clear, actionable guidance for Codex CLI when working on this project.

## Constraints
- Write instructions as direct commands to Codex CLI
- Focus on project-specific conventions and patterns
- Include concrete examples from the actual codebase
- Avoid generic programming advice
- Ensure instructions are compatible with Codex CLI processing

## Codex CLI Steering Guidelines

### Instruction Format
- Use imperative mood ("Use X", "Avoid Y", "Always Z")
- Be specific and actionable
- Include code examples where relevant
- Reference actual files and patterns from the project
- Structure information hierarchically for easy parsing

### Content Categories

#### Code Style and Conventions
- Naming conventions for files, functions, and variables
- Code formatting and structure requirements
- Comment and documentation standards
- Import/export patterns

#### Architecture Patterns
- Component organization principles
- Interface and type definitions
- Error handling approaches
- Testing strategies and patterns

#### Project-Specific Rules
- Framework-specific best practices
- Build and deployment considerations
- Performance optimization guidelines
- Security requirements

#### Integration Guidelines
- How to work with existing APIs
- Database interaction patterns
- External service integration
- Configuration management

## Approval Mode Considerations

### Interactive Mode
- Provide examples and explanations for each guideline
- Include rationale for project-specific decisions
- Allow for iterative refinement of guidelines
- Structure content for easy review and modification

### Auto-Edit Mode
- Focus on clear, unambiguous instructions
- Minimize subjective or interpretive guidance
- Provide specific code patterns and examples
- Ensure guidelines are immediately actionable

### Full-Auto Mode
- Create comprehensive, self-contained guidance
- Include all necessary context and examples
- Anticipate common scenarios and edge cases
- Provide complete decision-making framework

## Document Structure

```markdown
# [Steering Document Title]

## Overview
Brief description of the guidance provided in this document.

## Core Principles
- Fundamental rules that apply across the project
- Non-negotiable requirements and constraints

## Code Conventions
### Naming Conventions
- Specific patterns for different types of identifiers
- Examples from the actual codebase

### File Organization
- Directory structure requirements
- File naming patterns
- Module organization principles

### Code Style
- Formatting requirements
- Comment standards
- Import/export patterns

## Architecture Guidelines
### Component Design
- Interface definitions and patterns
- Dependency management
- Error handling approaches

### Testing Requirements
- Test structure and organization
- Coverage expectations
- Mock and stub patterns

## Project-Specific Rules
### [Domain-Specific Area 1]
- Specific requirements for this area
- Examples and patterns to follow

### [Domain-Specific Area 2]
- Additional project-specific guidance
- Integration patterns and requirements

## Examples
### Good Patterns
```typescript
// Example of preferred approach
```

### Anti-Patterns
```typescript
// Example of what to avoid
```

## References
- Links to relevant documentation
- Related files and examples in the codebase
```

## Success Criteria
- Steering document provides clear, actionable guidance
- Instructions are specific to this project's needs
- Examples reference actual codebase patterns
- Content is optimized for Codex CLI processing
- Document follows established steering format
- Guidelines improve code consistency and quality

Begin by analyzing the project structure and identifying the specific guidance needs described in the requirements.