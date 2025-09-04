import { describe, test, expect, beforeAll } from '@jest/globals';
import { PromptLoader } from '../../src/services/promptLoader';

describe('Prompt Integration Tests', () => {
  let promptLoader: PromptLoader;

  beforeAll(() => {
    // Initialize with real prompts
    promptLoader = PromptLoader.getInstance();
    promptLoader.initialize();
  });

  describe('Spec Creation Prompt', () => {
    test('INT-01: 生成正确的 spec 创建 prompt', () => {
      const variables = {
        description: 'A user authentication system with OAuth support',
        workspacePath: '/Users/test/my-project',
        specBasePath: '.claude/specs'
      };

      const result = promptLoader.renderPrompt('create-spec', variables);

      // Verify the prompt contains key elements
      expect(result).toContain('A user authentication system with OAuth support');
      expect(result).toContain('/Users/test/my-project');
      expect(result).toContain('.claude/specs');

      // Check for system instructions
      expect(result).toContain('<system>');
      expect(result).toContain('spec workflow');

      // Check for spec workflow mentions
      expect(result).toContain('Requirements');
      expect(result).toContain('Design');
      expect(result).toContain('Tasks');
    });

    test('INT-02: 验证 spec prompt 包含目录创建指令', () => {
      const result = promptLoader.renderPrompt('create-spec', {
        description: 'test feature',
        workspacePath: '/test',
        specBasePath: '.claude/specs'
      });

      expect(result).toMatch(/mkdir|create.*directory/i);
      expect(result).toContain('.claude/specs');
    });
  });

  describe('Steering Prompts', () => {
    describe('Init Steering', () => {
      test('INT-03: 生成 steering 初始化 prompt', () => {
        const result = promptLoader.renderPrompt('init-steering', {
          steeringPath: '/Users/test/project/.claude/steering'
        });

        expect(result).toContain('steering documents');
        expect(result).toContain('/Users/test/project/.claude/steering');
        expect(result).toContain('codebase');
      });

      test('INT-04: 验证 steering prompt 包含分析指令', () => {
        const result = promptLoader.renderPrompt('init-steering', {
          steeringPath: '/test/.claude/steering'
        });

        expect(result).toContain('analyzing');
        expect(result).toContain('patterns');
        expect(result).toContain('conventions');
      });

      test('INT-05: 验证 steering prompt 包含文件指令', () => {
        const result = promptLoader.renderPrompt('init-steering', {
          steeringPath: '/test/.claude/steering'
        });

        expect(result).toContain('file');
        expect(result).toContain('.md');
      });
    });

    describe('Create Custom Steering', () => {
      test('INT-06: 生成自定义 steering 创建 prompt', () => {
        const result = promptLoader.renderPrompt('create-custom-steering', {
          description: 'Security best practices for API development',
          steeringPath: '/test/project/.claude/steering'
        });

        expect(result).toContain('Security best practices for API development');
        expect(result).toContain('steering document');
        expect(result).toContain('/test/project/.claude/steering');
      });

      test('INT-07: 验证自定义 steering 文件命名指令', () => {
        const result = promptLoader.renderPrompt('create-custom-steering', {
          description: 'Test guidelines',
          steeringPath: '/test/.claude/steering'
        });

        expect(result).toContain('Choose an appropriate kebab-case filename');
        expect(result).toContain('.md');
      });
    });

    describe('Refine Steering', () => {
      test('INT-08: 生成 steering 精炼 prompt', () => {
        const result = promptLoader.renderPrompt('refine-steering', {
          filePath: '/test/project/.claude/steering/security.md'
        });

        expect(result).toContain('/test/project/.claude/steering/security.md');
        expect(result).toContain('refine');
        expect(result).toContain('Review and refine');
      });

      test('INT-09: 验证精炼 prompt 改进指南', () => {
        const result = promptLoader.renderPrompt('refine-steering', {
          filePath: '/test/.claude/steering/test.md'
        });

        expect(result).toContain('clear and direct');
        expect(result).toContain('specific to this project');
        expect(result).toContain('concrete examples');
      });
    });

    describe('Delete Steering', () => {
      test('INT-10: 生成 steering 删除 prompt', () => {
        const result = promptLoader.renderPrompt('delete-steering', {
          documentName: 'security-practices.md',
          steeringPath: '/test/.claude/steering'
        });

        expect(result).toContain('security-practices.md');
        expect(result).toContain('delete');
        expect(result).toContain('/test/.claude/steering');
      });
    });
  });

  describe('Prompt Structure Validation', () => {
    test('INT-11: 验证所有 prompts 的 frontmatter', () => {
      const allPrompts = promptLoader.listPrompts();

      expect(allPrompts.length).toBeGreaterThan(0);

      allPrompts.forEach(promptMeta => {
        expect(promptMeta.id).toBeTruthy();
        expect(promptMeta.name).toBeTruthy();
        expect(promptMeta.version).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });

    test('INT-12: 验证所有 prompts 可成功渲染', () => {
      const testCases = [
        {
          id: 'create-spec',
          variables: {
            description: 'test',
            workspacePath: '/test',
            specBasePath: '.claude/specs'
          }
        },
        {
          id: 'init-steering',
          variables: {
            steeringPath: '/test/.claude/steering'
          }
        },
        {
          id: 'create-custom-steering',
          variables: {
            description: 'test',
            steeringPath: '/test/.claude/steering'
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
            steeringPath: '/test/.claude/steering'
          }
        }
      ];

      testCases.forEach(({ id, variables }) => {
        expect(() => promptLoader.renderPrompt(id, variables)).not.toThrow();
      });
    });
  });

  describe('Prompt Content Quality', () => {
    test('INT-13: 验证渲染内容不含模板错误', () => {
      const testCases = [
        {
          id: 'create-spec',
          variables: {
            description: 'test feature',
            workspacePath: '/project',
            specBasePath: '.claude/specs'
          }
        },
        {
          id: 'init-steering',
          variables: {
            steeringPath: '/project/.claude/steering'
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

    test('INT-14: 验证 prompts 的结构一致性', () => {
      const specPrompt = promptLoader.renderPrompt('create-spec', {
        description: 'test',
        workspacePath: '/test',
        specBasePath: '.claude/specs'
      });

      const steeringPrompt = promptLoader.renderPrompt('init-steering', {
        steeringPath: '/test/.claude/steering'
      });

      // Both should have system instructions
      expect(specPrompt).toMatch(/<system>[\s\S]*<\/system>/);
      expect(steeringPrompt).toMatch(/<system>[\s\S]*<\/system>/);
    });
  });
});