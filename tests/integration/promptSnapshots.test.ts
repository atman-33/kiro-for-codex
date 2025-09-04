import { describe, test, expect, beforeAll } from '@jest/globals';
import { PromptLoader } from '../../src/services/promptLoader';

describe('Prompt 快照测试', () => {
  let promptLoader: PromptLoader;

  beforeAll(() => {
    promptLoader = PromptLoader.getInstance();
    promptLoader.initialize();
  });

  test('INT-15: create spec prompt 快照测试', () => {
    const result = promptLoader.renderPrompt('create-spec', {
      description: 'User authentication with JWT',
      workspacePath: '/snapshot/test',
      specBasePath: '.claude/specs'
    });

    expect(result).toMatchSnapshot();
  });

  test('INT-16: init steering prompt 快照测试', () => {
    const result = promptLoader.renderPrompt('init-steering', {
      steeringPath: '/snapshot/test/.claude/steering'
    });

    expect(result).toMatchSnapshot();
  });

  test('INT-17: create custom steering prompt 快照测试', () => {
    const result = promptLoader.renderPrompt('create-custom-steering', {
      description: 'API design patterns and best practices',
      steeringPath: '/snapshot/test/.claude/steering'
    });

    expect(result).toMatchSnapshot();
  });

  test('INT-18: refine steering prompt 快照测试', () => {
    const result = promptLoader.renderPrompt('refine-steering', {
      filePath: '/snapshot/test/.claude/steering/api-guidelines.md'
    });

    expect(result).toMatchSnapshot();
  });

  test('INT-19: delete steering prompt 快照测试', () => {
    const result = promptLoader.renderPrompt('delete-steering', {
      documentName: 'deprecated-guidelines.md',
      steeringPath: '/snapshot/test/.claude/steering'
    });

    expect(result).toMatchSnapshot();
  });
});