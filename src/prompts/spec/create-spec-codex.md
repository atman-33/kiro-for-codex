---
id: create-spec-codex
name: Create Spec with Codex CLI Integration
version: 1.0.0
description: Codex-optimized prompt for creating a spec with the full workflow
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
  approvalMode:
    type: string
    required: false
    default: "interactive"
    description: Codex CLI approval mode (interactive, auto-edit, full-auto)
---

# Task: Create Feature Specification

## Context
You are working with Codex CLI to develop a comprehensive feature specification. This workflow transforms a rough idea into a detailed requirements document, design document, and implementation plan.

**Workspace:** {{workspacePath}}
**Spec Directory:** {{specBasePath}}
**Approval Mode:** {{approvalMode}}

## Feature Description
{{description}}

## Expected Output
Create a complete specification including:
1. Requirements document (EARS format)
2. Design document with architecture diagrams
3. Implementation task list

## Constraints
- Use Codex CLI best practices for code generation
- Ensure all documents are optimized for Codex processing
- Follow incremental development approach
- Include comprehensive error handling
- Maintain compatibility with existing project structure

## Codex CLI Optimization Guidelines

### Prompt Structure
- Use clear, actionable language
- Include specific context and constraints
- Provide concrete examples when needed
- Structure information hierarchically

### Approval Mode Considerations
**Interactive Mode ({{approvalMode}}):**
- Provide step-by-step guidance
- Include review checkpoints
- Allow for user feedback and iteration

**Auto-Edit Mode:**
- Focus on precise, unambiguous instructions
- Minimize need for clarification
- Include comprehensive context

**Full-Auto Mode:**
- Provide complete specifications upfront
- Include all necessary constraints and requirements
- Ensure self-contained execution

## Workflow Instructions

### 1. Requirements Gathering
Create `{{specBasePath}}/{feature-name}/requirements.md` with:
- Clear introduction summarizing the feature
- User stories in format: "As a [role], I want [feature], so that [benefit]"
- EARS format acceptance criteria:
  - WHEN [event] THEN [system] SHALL [response]
  - IF [precondition] THEN [system] SHALL [response]

### 2. Design Document
Create `{{specBasePath}}/{feature-name}/design.md` with:
- Overview and architecture
- Component interfaces (TypeScript format)
- Mermaid diagrams for system architecture
- Data models and error handling strategy
- Testing approach

### 3. Implementation Tasks
Create `{{specBasePath}}/{feature-name}/tasks.md` with:
- Numbered checkbox list (max 2 levels)
- Each task references specific requirements
- Focus only on coding activities
- Incremental, testable steps

## Success Criteria
- All documents are Codex CLI compatible
- Clear separation of concerns between documents
- Actionable implementation plan
- Comprehensive error handling coverage
- Maintainable and scalable design

Begin by choosing a kebab-case feature name and creating the requirements document.