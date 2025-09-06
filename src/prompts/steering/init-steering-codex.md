---
id: init-steering-codex
name: Initialize Steering Documents for Codex CLI
version: 1.0.0
description: Codex-optimized prompt for initializing steering documents
variables:
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

# Task: Initialize Project Steering Documents

## Context
You are analyzing this codebase to create foundational steering documents that will guide Codex CLI when working on this project. These documents establish the core conventions, patterns, and requirements for consistent code generation.

**Steering Path:** {{steeringPath}}
**Approval Mode:** {{approvalMode}}

## Expected Output
Three foundational steering documents that provide comprehensive guidance for Codex CLI:
1. `product.md` - Product context and business logic
2. `tech.md` - Technical stack and development practices
3. `structure.md` - Project organization and architecture

## Constraints
- Analyze the actual codebase to extract real patterns
- Write instructions as direct commands to Codex CLI
- Focus on project-specific conventions, not generic advice
- Ensure compatibility with Codex CLI processing patterns
- Check for existing files before creating new ones

## Codex CLI Analysis Guidelines

### Codebase Analysis Approach
- Examine package.json for dependencies and scripts
- Review tsconfig.json for TypeScript configuration
- Analyze directory structure and file organization
- Identify common patterns in existing code
- Extract naming conventions and code style
- Understand build and test processes

### Documentation Strategy
- Write clear, imperative instructions
- Include specific examples from the codebase
- Reference actual file paths and patterns
- Provide decision-making frameworks
- Structure information for easy Codex CLI parsing

## Document Specifications

### 1. Product Document (`product.md`)
**Purpose:** Provide business context and product understanding

**Content Requirements:**
- Product purpose and core value proposition
- Key features and functionality overview
- User personas and use cases
- Business logic rules and constraints
- Domain-specific terminology and concepts

**Structure:**
```markdown
# Product Context

## Purpose
[Clear statement of what this product does and why it exists]

## Core Features
- [Feature 1]: [Brief description and business value]
- [Feature 2]: [Brief description and business value]

## User Personas
### [Persona 1]
- Role and responsibilities
- Key use cases and workflows
- Success criteria and goals

## Business Rules
- [Rule 1]: [Specific constraint or requirement]
- [Rule 2]: [Specific constraint or requirement]

## Domain Concepts
- [Concept 1]: [Definition and usage context]
- [Concept 2]: [Definition and usage context]
```

### 2. Technical Document (`tech.md`)
**Purpose:** Define technical stack and development practices

**Content Requirements:**
- Technology stack and framework versions
- Build system and development tools
- Testing frameworks and practices
- Code quality standards and linting rules
- Common development commands and workflows

**Structure:**
```markdown
# Technical Guidelines

## Technology Stack
- Runtime: [Version and configuration]
- Framework: [Version and key features used]
- Database: [Type and connection patterns]
- Testing: [Frameworks and approaches]

## Development Environment
### Required Tools
- [Tool 1]: [Version and purpose]
- [Tool 2]: [Version and purpose]

### Common Commands
```bash
# Build the project
[command]

# Run tests
[command]

# Start development server
[command]
```

## Code Standards
### TypeScript Configuration
- [Key tsconfig settings and rationale]
- [Type definition patterns]

### Code Quality
- [Linting rules and exceptions]
- [Formatting standards]
- [Import/export conventions]

## Testing Practices
- [Test file organization]
- [Naming conventions for tests]
- [Mock and stub patterns]
```

### 3. Structure Document (`structure.md`)
**Purpose:** Define project organization and architecture patterns

**Content Requirements:**
- Directory structure and organization principles
- File naming conventions and patterns
- Component architecture and relationships
- Module boundaries and dependencies
- Key file locations and purposes

**Structure:**
```markdown
# Project Structure

## Directory Organization
```
[project-root]/
├── src/
│   ├── components/     # [Purpose and patterns]
│   ├── services/       # [Purpose and patterns]
│   └── utils/          # [Purpose and patterns]
├── tests/              # [Test organization]
└── docs/               # [Documentation]
```

## File Naming Conventions
- Components: [Pattern and examples]
- Services: [Pattern and examples]
- Tests: [Pattern and examples]
- Configuration: [Pattern and examples]

## Architecture Patterns
### Component Organization
- [How components are structured]
- [Dependency patterns]
- [Interface definitions]

### Module Boundaries
- [How modules are separated]
- [Import/export patterns]
- [Circular dependency prevention]

## Key Files and Locations
- Configuration: [Location and purpose]
- Entry points: [Location and purpose]
- Shared utilities: [Location and purpose]
```

## Implementation Instructions

### Analysis Phase
1. Examine the project structure and identify key patterns
2. Review package.json, tsconfig.json, and other configuration files
3. Analyze existing code for conventions and patterns
4. Identify the technology stack and development tools
5. Understand the build and test processes

### Creation Phase
1. Check if files already exist in {{steeringPath}}
2. Create only non-existing files
3. Write content based on actual codebase analysis
4. Include specific examples and references
5. Structure content for Codex CLI compatibility

### Validation Phase
1. Ensure all three documents are created (if they didn't exist)
2. Verify content is specific to this project
3. Check that examples reference actual code patterns
4. Confirm instructions are clear and actionable

## Success Criteria
- Three steering documents created (product.md, tech.md, structure.md)
- Content is based on actual codebase analysis
- Instructions are specific and actionable for Codex CLI
- Examples reference real files and patterns from the project
- Documents provide comprehensive guidance for development
- No existing files are overwritten

Begin by analyzing the project structure and extracting the key patterns and conventions used in this codebase.