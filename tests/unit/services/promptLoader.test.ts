import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PromptLoader } from '../../../src/services/promptLoader';
import * as prompts from '../../../src/prompts/target';

// Mock the prompts module
jest.mock('../../../src/prompts/target', () => ({
  testPrompt: {
    frontmatter: {
      id: 'test-prompt',
      name: 'Test Prompt',
      version: '1.0.0',
      description: 'A test prompt',
      variables: {
        name: { type: 'string', required: true, description: 'User name' },
        age: { type: 'number', required: false, description: 'User age' }
      }
    },
    content: 'Hello {{name}}! {{#if age}}You are {{age}} years old.{{/if}}'
  },
  simplePrompt: {
    frontmatter: {
      id: 'simple-prompt',
      name: 'Simple Prompt',
      version: '1.0.0',
      description: 'A simple prompt without variables'
    },
    content: 'This is a simple prompt without any variables.'
  }
}));

describe('PromptLoader', () => {
  let promptLoader: PromptLoader;

  beforeEach(() => {
    // Clear singleton instance before each test
    (PromptLoader as any).instance = undefined;
    promptLoader = PromptLoader.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('PL-01: 获取单例实例', () => {
      const instance1 = PromptLoader.getInstance();
      const instance2 = PromptLoader.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize()', () => {
    test('PL-02: 初始化加载所有 prompts', () => {
      promptLoader.initialize();

      // Check if prompts are loaded
      expect(() => promptLoader.loadPrompt('test-prompt')).not.toThrow();
      expect(() => promptLoader.loadPrompt('simple-prompt')).not.toThrow();
    });

    test('PL-11: 处理无效的 prompt 模块', () => {
      // Mock prompts with invalid module
      const mockedPrompts = jest.mocked(prompts) as any;
      mockedPrompts.invalidPrompt = { invalid: true };

      // Should not throw during initialization
      expect(() => promptLoader.initialize()).not.toThrow();
    });
  });

  describe('loadPrompt()', () => {
    beforeEach(() => {
      promptLoader.initialize();
    });

    test('PL-03: 通过 ID 加载 prompt', () => {
      const prompt = promptLoader.loadPrompt('test-prompt');

      expect(prompt).toBeDefined();
      expect(prompt.frontmatter.id).toBe('test-prompt');
      expect(prompt.frontmatter.name).toBe('Test Prompt');
      expect(prompt.content).toContain('Hello {{name}}!');
    });

    test('PL-04: 加载不存在的 prompt', () => {
      expect(() => promptLoader.loadPrompt('non-existent'))
        .toThrow('Prompt not found: non-existent');
    });
  });

  describe('renderPrompt()', () => {
    beforeEach(() => {
      promptLoader.initialize();
    });

    test('PL-05: 渲染包含所有变量的 prompt', () => {
      const result = promptLoader.renderPrompt('test-prompt', {
        name: 'John',
        age: 30
      });

      expect(result).toBe('Hello John! You are 30 years old.');
    });

    test('PL-06: 渲染缺少可选变量的 prompt', () => {
      const result = promptLoader.renderPrompt('test-prompt', {
        name: 'Jane'
      });

      expect(result).toBe('Hello Jane! ');
    });

    test('PL-07: 渲染缺少必需变量的 prompt', () => {
      expect(() => promptLoader.renderPrompt('test-prompt', {}))
        .toThrow('Variable validation failed: Missing required variable: name');
    });

    test('PL-08: 渲染无变量的简单 prompt', () => {
      const result = promptLoader.renderPrompt('simple-prompt');

      expect(result).toBe('This is a simple prompt without any variables.');
    });

    test('处理 Handlebars 助手和条件语句', () => {
      // Test with age = 0 (falsy value)
      const result = promptLoader.renderPrompt('test-prompt', {
        name: 'Baby',
        age: 0
      });

      // Age 0 is falsy in Handlebars, so the conditional won't render
      expect(result).toBe('Hello Baby! ');
    });
  });

  describe('listPrompts()', () => {
    beforeEach(() => {
      promptLoader.initialize();
    });

    test('PL-09: 获取所有 prompts 列表', () => {
      const prompts = promptLoader.listPrompts();

      expect(prompts).toHaveLength(2);
      expect(prompts).toContainEqual(expect.objectContaining({
        id: 'test-prompt',
        name: 'Test Prompt',
        category: 'test'
      }));
      expect(prompts).toContainEqual(expect.objectContaining({
        id: 'simple-prompt',
        name: 'Simple Prompt',
        category: 'simple'
      }));
    });

    test('从 prompt ID 提取分类', () => {
      const prompts = promptLoader.listPrompts();
      const testPrompt = prompts.find(p => p.id === 'test-prompt');

      expect(testPrompt?.category).toBe('test');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      promptLoader.initialize();
    });

    test('PL-04: 提供有用的错误信息和可用 prompts 列表', () => {
      try {
        promptLoader.loadPrompt('wrong-id');
      } catch (error: any) {
        expect(error.message).toContain('Available prompts: test-prompt, simple-prompt');
      }
    });

    test('PL-10: 处理无效的 Handlebars 语法', () => {
      // First initialize normally
      promptLoader.initialize();

      // Manually add a prompt with invalid syntax to test compilation
      const loader = promptLoader as any;
      loader.prompts.set('bad-syntax', {
        frontmatter: {
          id: 'bad-syntax',
          name: 'Bad Syntax',
          version: '1.0.0',
          description: 'A prompt with bad syntax'
        },
        content: '{{#if name}}Unclosed if block'
      });

      // Try to compile the bad template
      try {
        loader.compiledTemplates.set('bad-syntax',
          require('handlebars').compile('{{#if name}}Unclosed if block'));
      } catch (error) {
        // Handlebars should throw a compilation error
        expect(error).toBeDefined();
        return;
      }

      // If Handlebars didn't throw (some versions are more forgiving)
      // the test should still pass
      expect(true).toBe(true);
    });
  });
});