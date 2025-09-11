import { beforeAll, describe, expect, test } from 'vitest';
import { PromptLoader } from '../../src/services/prompt-loader';

describe('Prompt Integration Tests', () => {
  let promptLoader: PromptLoader;

  beforeAll(() => {
    // Initialize with real prompts
    promptLoader = PromptLoader.getInstance();
    promptLoader.initialize();
  });

  describe('Spec Creation Prompt', () => {
    test('Generate correct spec creation prompt', () => {
      const variables = {
        description: 'A user authentication system with OAuth support',
        workspacePath: '/Users/test/my-project',
        specBasePath: '.codex/specs'
      };

      const result = promptLoader.renderPrompt('create-spec', variables);

      // Verify the prompt contains key elements
      expect(result).toContain('A user authentication system with OAuth support');
      expect(result).toContain('/Users/test/my-project');
      expect(result).toContain('.codex/specs');

      // Check for system instructions
      expect(result).toContain('<system>');
      expect(result).toContain('spec workflow');

      // Check for spec workflow mentions
      expect(result).toContain('Requirements');
      expect(result).toContain('Design');
      expect(result).toContain('Tasks');
    });

    test('Verify spec prompt contains directory creation instructions', () => {
      const result = promptLoader.renderPrompt('create-spec', {
        description: 'test feature',
        workspacePath: '/test',
        specBasePath: '.codex/specs'
      });

      expect(result).toMatch(/mkdir|create.*directory/i);
      expect(result).toContain('.codex/specs');
    });
  });

  describe('Steering Prompts', () => {
    describe('Init Steering', () => {
      test('Generate steering initialization prompt', () => {
        const result = promptLoader.renderPrompt('init-steering', {
          steeringPath: '/Users/test/project/.codex/steering'
        });

        expect(result).toContain('steering documents');
        expect(result).toContain('/Users/test/project/.codex/steering');
        expect(result).toContain('codebase');
      });

      test('Verify steering prompt contains analysis instructions', () => {
        const result = promptLoader.renderPrompt('init-steering', {
          steeringPath: '/test/.codex/steering'
        });

        expect(result).toContain('analyzing');
        expect(result).toContain('patterns');
        expect(result).toContain('conventions');
      });

      test('Verify steering prompt contains file instructions', () => {
        const result = promptLoader.renderPrompt('init-steering', {
          steeringPath: '/test/.codex/steering'
        });

        expect(result).toContain('file');
        expect(result).toContain('.md');
      });
    });

    describe('Create Custom Steering', () => {
      test('Generate custom steering creation prompt', () => {
        const result = promptLoader.renderPrompt('create-custom-steering', {
          description: 'Security best practices for API development',
          steeringPath: '/test/project/.codex/steering'
        });

        expect(result).toContain('Security best practices for API development');
        expect(result).toContain('steering document');
        expect(result).toContain('/test/project/.codex/steering');
      });

      test('Verify custom steering file naming instructions', () => {
        const result = promptLoader.renderPrompt('create-custom-steering', {
          description: 'Test guidelines',
          steeringPath: '/test/.codex/steering'
        });

        expect(result).toContain('Choose an appropriate kebab-case filename');
        expect(result).toContain('Create the document in the');
      });
    });

    describe('Refine Steering', () => {
      test('Generate steering refinement prompt', () => {
        const result = promptLoader.renderPrompt('refine-steering', {
          filePath: '/test/project/.codex/steering/security.md'
        });

        expect(result).toContain('/test/project/.codex/steering/security.md');
        expect(result).toContain('refine');
        expect(result).toContain('Review and refine');
      });

      test('Verify refinement prompt improvement guidelines', () => {
        const result = promptLoader.renderPrompt('refine-steering', {
          filePath: '/test/.codex/steering/test.md'
        });

        expect(result).toContain('clear and direct');
        expect(result).toContain('specific to this project');
        expect(result).toContain('concrete examples');
      });
    });

    describe('Delete Steering', () => {
      test('Generate steering deletion prompt', () => {
        const result = promptLoader.renderPrompt('delete-steering', {
          documentName: 'security-practices.md',
          steeringPath: '/test/.codex/steering'
        });

        expect(result).toContain('security-practices.md');
        expect(result).toContain('delete');
        expect(result).toContain('/test/.codex/steering');
      });
    });
  });

  describe('Prompt Structure Validation', () => {
    test('Verify frontmatter of all prompts', () => {
      const allPrompts = promptLoader.listPrompts();

      expect(allPrompts.length).toBeGreaterThan(0);

      allPrompts.forEach(promptMeta => {
        expect(promptMeta.id).toBeTruthy();
        expect(promptMeta.name).toBeTruthy();
        expect(promptMeta.version).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });

    test('Verify all prompts render successfully', () => {
      const testCases = [
        {
          id: 'create-spec',
          variables: {
            description: 'test',
            workspacePath: '/test',
            specBasePath: '.codex/specs'
          }
        },
        {
          id: 'init-steering',
          variables: {
            steeringPath: '/test/.codex/steering'
          }
        },
        {
          id: 'create-custom-steering',
          variables: {
            description: 'test',
            steeringPath: '/test/.codex/steering'
          }
        },
        {
          id: 'refine-steering',
          variables: {
            filePath: '/test/file.md'
          }
        },
        {
          id: 'delete-steering',
          variables: {
            documentName: 'test.md',
            steeringPath: '/test/.codex/steering'
          }
        }
      ];

      testCases.forEach(({ id, variables }) => {
        expect(() => promptLoader.renderPrompt(id, variables)).not.toThrow();
      });
    });
  });

  describe('Prompt Content Quality', () => {
    test('Verify rendered content has no template errors', () => {
      const testCases = [
        {
          id: 'create-spec',
          variables: {
            description: 'test feature',
            workspacePath: '/project',
            specBasePath: '.codex/specs'
          }
        },
        {
          id: 'init-steering',
          variables: {
            steeringPath: '/project/.codex/steering'
          }
        }
      ];

      testCases.forEach(({ id, variables }) => {
        const result = promptLoader.renderPrompt(id, variables);

        // Check for common template errors
        expect(result).not.toContain('{{');
        expect(result).not.toContain('}}');
        expect(result).not.toContain('undefined');
        expect(result).not.toContain('[object Object]');
      });
    });

    test('Verify structural consistency of prompts', () => {
      const specPrompt = promptLoader.renderPrompt('create-spec', {
        description: 'test',
        workspacePath: '/test',
        specBasePath: '.codex/specs'
      });

      const steeringPrompt = promptLoader.renderPrompt('init-steering', {
        steeringPath: '/test/.codex/steering'
      });

      // Both should have system instructions
      expect(specPrompt).toMatch(/<system>[\s\S]*<\/system>/);
      expect(steeringPrompt).toMatch(/<system>[\s\S]*<\/system>/);
    });
  });
});
