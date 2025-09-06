// Auto-generated from src/prompts/spec/create-spec-codex.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "create-spec-codex",
  "name": "Create Spec with Codex CLI Integration",
  "version": "1.0.0",
  "description": "Codex-optimized prompt for creating a spec with the full workflow",
  "variables": {
    "description": {
      "type": "string",
      "required": true,
      "description": "User's feature description"
    },
    "workspacePath": {
      "type": "string",
      "required": true,
      "description": "Workspace root path"
    },
    "specBasePath": {
      "type": "string",
      "required": true,
      "description": "Base path for specs directory"
    },
    "approvalMode": {
      "type": "string",
      "required": false,
      "default": "interactive",
      "description": "Codex CLI approval mode (interactive, auto-edit, full-auto)"
    }
  }
};

export const content = "\n# Task: Create Feature Specification\n\n## Context\nYou are working with Codex CLI to develop a comprehensive feature specification. This workflow transforms a rough idea into a detailed requirements document, design document, and implementation plan.\n\n**Workspace:** {{workspacePath}}\n**Spec Directory:** {{specBasePath}}\n**Approval Mode:** {{approvalMode}}\n\n## Feature Description\n{{description}}\n\n## Expected Output\nCreate a complete specification including:\n1. Requirements document (EARS format)\n2. Design document with architecture diagrams\n3. Implementation task list\n\n## Constraints\n- Use Codex CLI best practices for code generation\n- Ensure all documents are optimized for Codex processing\n- Follow incremental development approach\n- Include comprehensive error handling\n- Maintain compatibility with existing project structure\n\n## Codex CLI Optimization Guidelines\n\n### Prompt Structure\n- Use clear, actionable language\n- Include specific context and constraints\n- Provide concrete examples when needed\n- Structure information hierarchically\n\n### Approval Mode Considerations\n**Interactive Mode ({{approvalMode}}):**\n- Provide step-by-step guidance\n- Include review checkpoints\n- Allow for user feedback and iteration\n\n**Auto-Edit Mode:**\n- Focus on precise, unambiguous instructions\n- Minimize need for clarification\n- Include comprehensive context\n\n**Full-Auto Mode:**\n- Provide complete specifications upfront\n- Include all necessary constraints and requirements\n- Ensure self-contained execution\n\n## Workflow Instructions\n\n### 1. Requirements Gathering\nCreate `{{specBasePath}}/{feature-name}/requirements.md` with:\n- Clear introduction summarizing the feature\n- User stories in format: \"As a [role], I want [feature], so that [benefit]\"\n- EARS format acceptance criteria:\n  - WHEN [event] THEN [system] SHALL [response]\n  - IF [precondition] THEN [system] SHALL [response]\n\n### 2. Design Document\nCreate `{{specBasePath}}/{feature-name}/design.md` with:\n- Overview and architecture\n- Component interfaces (TypeScript format)\n- Mermaid diagrams for system architecture\n- Data models and error handling strategy\n- Testing approach\n\n### 3. Implementation Tasks\nCreate `{{specBasePath}}/{feature-name}/tasks.md` with:\n- Numbered checkbox list (max 2 levels)\n- Each task references specific requirements\n- Focus only on coding activities\n- Incremental, testable steps\n\n## Success Criteria\n- All documents are Codex CLI compatible\n- Clear separation of concerns between documents\n- Actionable implementation plan\n- Comprehensive error handling coverage\n- Maintainable and scalable design\n\nBegin by choosing a kebab-case feature name and creating the requirements document.";

export default {
  frontmatter,
  content
};
