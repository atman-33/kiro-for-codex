import * as fs from 'fs';
import { glob } from 'glob';
import matter from 'gray-matter';
import * as path from 'path';
import { describe, expect, test } from 'vitest';

describe('Markdown Prompt Parsing', () => {
  const promptsDir = path.join(__dirname, '../../../src/prompts');

  describe('Markdown File Structure', () => {
    test('Verify frontmatter of all markdown files', () => {
      const mdFiles = glob.sync('**/*.md', { cwd: promptsDir });

      expect(mdFiles.length).toBeGreaterThan(0);

      mdFiles.forEach((file: string) => {
        const content = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
        const { data, content: body } = matter(content);

        // Skip README files and other documentation files as they don't need frontmatter
        if (file.includes('README') || file.includes('optimization-guide') || file.includes('approval-mode-templates')) {
          return;
        }

        // Check required frontmatter fields with file context
        try {
          expect(data.id).toBeTruthy();
          expect(data.name).toBeTruthy();
          expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
          expect(data.description).toBeTruthy();

          // Check content is not empty
          expect(body.trim()).toBeTruthy();
        } catch (error) {
          throw new Error(`File ${file} failed validation: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    });

    test('Verify Handlebars variable definition consistency', () => {
      const mdFiles = glob.sync('**/*.md', { cwd: promptsDir });

      mdFiles.forEach((file: string) => {
        const content = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
        const { data, content: body } = matter(content);

        // Extract all Handlebars variables used in content
        const variablePattern = /\{\{([^}]+)\}\}/g;
        const usedVariables = new Set<string>();
        let match;

        while ((match = variablePattern.exec(body)) !== null) {
          // Extract variable name, handling helpers like {{#if age}}
          const varMatch = match[1].trim().match(/^#?\w+\s+(\w+)|^(\w+)/);
          if (varMatch) {
            const varName = varMatch[1] || varMatch[2];
            if (varName && !['if', 'unless', 'each', 'with'].includes(varName)) {
              usedVariables.add(varName);
            }
          }
        }

        // Check that all used variables are defined in frontmatter
        if (data.variables) {
          usedVariables.forEach(varName => {
            expect(data.variables).toHaveProperty(varName);
          });
        }
      });
    });
  });

  describe('Example Markdown Prompts', () => {
    test('Verify create-spec.md file structure', () => {
      const specPromptPath = path.join(promptsDir, 'spec/create-spec.md');
      const content = fs.readFileSync(specPromptPath, 'utf-8');
      const { data, content: body } = matter(content);

      // Verify frontmatter
      expect(data).toEqual({
        id: 'create-spec',
        name: 'Create Spec with Complete Workflow',
        version: '1.0.0',
        description: 'Complete prompt for creating a spec with the full workflow including system instructions',
        variables: {
          description: {
            type: 'string',
            required: true,
            description: "User's feature description"
          },
          workspacePath: {
            type: 'string',
            required: true,
            description: 'Workspace root path'
          },
          specBasePath: {
            type: 'string',
            required: true,
            description: 'Base path for specs directory'
          }
        }
      });

      // Verify content structure
      expect(body).toContain('<system>');
      expect(body).toContain('</system>');
      expect(body).toContain('{{description}}');
      expect(body).toContain('{{workspacePath}}');
      expect(body).toContain('{{specBasePath}}');
    });

    test('Verify init-steering.md file structure', () => {
      const steeringPromptPath = path.join(promptsDir, 'steering/init-steering.md');
      const content = fs.readFileSync(steeringPromptPath, 'utf-8');
      const { data, content: body } = matter(content);

      // Verify it has required structure
      expect(data.id).toBe('init-steering');
      expect(data.variables).toHaveProperty('steeringPath');
      expect(body).toContain('{{steeringPath}}');
    });
  });

  describe('Markdown to TypeScript Compilation', () => {
    test('Verify compiled TypeScript file consistency', () => {
      // Compare a markdown file with its compiled TypeScript
      const mdPath = path.join(promptsDir, 'spec/create-spec.md');
      const tsPath = path.join(promptsDir, 'target/spec/create-spec.ts');

      // Read markdown
      const mdContent = fs.readFileSync(mdPath, 'utf-8');
      const { data: mdData, content: mdBody } = matter(mdContent);

      // Read compiled TypeScript
      const tsContent = fs.readFileSync(tsPath, 'utf-8').replace(/\r/g, '');

      // Verify TypeScript contains the same frontmatter data
      expect(tsContent).toContain(`"id": "${mdData.id}"`);
      expect(tsContent).toContain(`"name": "${mdData.name}"`);
      expect(tsContent).toContain(`"version": "${mdData.version}"`);

      // Verify content is preserved (accounting for escape characters)
      const escapedBody = mdBody
        .replace(/\r/g, '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      expect(tsContent).toContain(escapedBody);
    });
  });
});

describe('Test with Mock Markdown Files', () => {
  test('Parse simple greeting prompt', () => {
    const mockMarkdown = `---
id: test-greeting
name: Greeting Prompt
version: 1.0.0
description: A friendly greeting prompt
variables:
  name:
    type: string
    required: true
    description: Person's name
  mood:
    type: string
    required: false
    description: Current mood
---

# Hello {{name}}!

{{#if mood}}
You seem to be feeling {{mood}} today.
{{else}}
How are you feeling today?
{{/if}}

Let me help you with your request.`;

    const { data, content } = matter(mockMarkdown);

    // Verify parsing
    expect(data.id).toBe('test-greeting');
    expect(data.variables.name.required).toBe(true);
    expect(data.variables.mood.required).toBe(false);
    expect(content).toContain('Hello {{name}}!');
    expect(content).toContain('{{#if mood}}');
  });

  test('Parse complex prompt with system tags', () => {
    const mockMarkdown = `---
id: complex-prompt
name: Complex System Prompt
version: 2.0.0
description: A prompt with system instructions
variables:
  task:
    type: string
    required: true
    description: Task description
  context:
    type: object
    required: false
    description: Additional context
---

<system>
You are an AI assistant specialized in {{task}}.

Follow these guidelines:
- Be concise and accurate
- Use examples when helpful
- Maintain a professional tone
</system>

## Task: {{task}}

{{#if context}}
### Context
{{#each context}}
- {{@key}}: {{this}}
{{/each}}
{{/if}}

Please proceed with the task.`;

    const { data, content } = matter(mockMarkdown);

    expect(data.version).toBe('2.0.0');
    expect(content).toContain('<system>');
    expect(content).toContain('</system>');
    expect(content).toContain('{{#each context}}');
  });
});
