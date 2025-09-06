// Auto-generated from src/prompts/steering/create-custom-steering-codex.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "create-custom-steering-codex",
  "name": "Create Custom Steering Document for Codex CLI",
  "version": "1.0.0",
  "description": "Codex-optimized prompt for creating custom steering documents",
  "variables": {
    "description": {
      "type": "string",
      "required": true,
      "description": "User's guidance needs description"
    },
    "steeringPath": {
      "type": "string",
      "required": true,
      "description": "Path where steering documents should be created"
    },
    "approvalMode": {
      "type": "string",
      "required": false,
      "default": "interactive",
      "description": "Codex CLI approval mode"
    }
  }
};

export const content = "\n# Task: Create Custom Steering Document\n\n## Context\nYou are creating a steering document that will guide Codex CLI when working on this codebase. Steering documents provide project-specific instructions that ensure consistent code quality and adherence to established patterns.\n\n**Steering Path:** {{steeringPath}}\n**Approval Mode:** {{approvalMode}}\n\n## Guidance Requirements\n{{description}}\n\n## Expected Output\nA comprehensive steering document that provides clear, actionable guidance for Codex CLI when working on this project.\n\n## Constraints\n- Write instructions as direct commands to Codex CLI\n- Focus on project-specific conventions and patterns\n- Include concrete examples from the actual codebase\n- Avoid generic programming advice\n- Ensure instructions are compatible with Codex CLI processing\n\n## Codex CLI Steering Guidelines\n\n### Instruction Format\n- Use imperative mood (\"Use X\", \"Avoid Y\", \"Always Z\")\n- Be specific and actionable\n- Include code examples where relevant\n- Reference actual files and patterns from the project\n- Structure information hierarchically for easy parsing\n\n### Content Categories\n\n#### Code Style and Conventions\n- Naming conventions for files, functions, and variables\n- Code formatting and structure requirements\n- Comment and documentation standards\n- Import/export patterns\n\n#### Architecture Patterns\n- Component organization principles\n- Interface and type definitions\n- Error handling approaches\n- Testing strategies and patterns\n\n#### Project-Specific Rules\n- Framework-specific best practices\n- Build and deployment considerations\n- Performance optimization guidelines\n- Security requirements\n\n#### Integration Guidelines\n- How to work with existing APIs\n- Database interaction patterns\n- External service integration\n- Configuration management\n\n## Approval Mode Considerations\n\n### Interactive Mode\n- Provide examples and explanations for each guideline\n- Include rationale for project-specific decisions\n- Allow for iterative refinement of guidelines\n- Structure content for easy review and modification\n\n### Auto-Edit Mode\n- Focus on clear, unambiguous instructions\n- Minimize subjective or interpretive guidance\n- Provide specific code patterns and examples\n- Ensure guidelines are immediately actionable\n\n### Full-Auto Mode\n- Create comprehensive, self-contained guidance\n- Include all necessary context and examples\n- Anticipate common scenarios and edge cases\n- Provide complete decision-making framework\n\n## Document Structure\n\n```markdown\n# [Steering Document Title]\n\n## Overview\nBrief description of the guidance provided in this document.\n\n## Core Principles\n- Fundamental rules that apply across the project\n- Non-negotiable requirements and constraints\n\n## Code Conventions\n### Naming Conventions\n- Specific patterns for different types of identifiers\n- Examples from the actual codebase\n\n### File Organization\n- Directory structure requirements\n- File naming patterns\n- Module organization principles\n\n### Code Style\n- Formatting requirements\n- Comment standards\n- Import/export patterns\n\n## Architecture Guidelines\n### Component Design\n- Interface definitions and patterns\n- Dependency management\n- Error handling approaches\n\n### Testing Requirements\n- Test structure and organization\n- Coverage expectations\n- Mock and stub patterns\n\n## Project-Specific Rules\n### [Domain-Specific Area 1]\n- Specific requirements for this area\n- Examples and patterns to follow\n\n### [Domain-Specific Area 2]\n- Additional project-specific guidance\n- Integration patterns and requirements\n\n## Examples\n### Good Patterns\n```typescript\n// Example of preferred approach\n```\n\n### Anti-Patterns\n```typescript\n// Example of what to avoid\n```\n\n## References\n- Links to relevant documentation\n- Related files and examples in the codebase\n```\n\n## Success Criteria\n- Steering document provides clear, actionable guidance\n- Instructions are specific to this project's needs\n- Examples reference actual codebase patterns\n- Content is optimized for Codex CLI processing\n- Document follows established steering format\n- Guidelines improve code consistency and quality\n\nBegin by analyzing the project structure and identifying the specific guidance needs described in the requirements.";

export default {
  frontmatter,
  content
};
