import { beforeAll, describe, expect, test } from 'vitest';
import { PromptLoader } from '../../src/services/prompt-loader';

describe('Prompt Snapshot Tests', () => {
  let promptLoader: PromptLoader;

  beforeAll(() => {
    promptLoader = PromptLoader.getInstance();
    promptLoader.initialize();
  });

  test('create spec prompt snapshot', () => {
    const result = promptLoader.renderPrompt('create-spec', {
      description: 'User authentication with JWT',
      workspacePath: '/snapshot/test',
      specBasePath: '.codex/specs'
    });

    expect(result).toMatchSnapshot();
  });

  test('init steering prompt snapshot', () => {
    const result = promptLoader.renderPrompt('init-steering', {
      steeringPath: '/snapshot/test/.codex/steering'
    });

    expect(result).toMatchSnapshot();
  });

  test('create custom steering prompt basic content', () => {
    const result = promptLoader.renderPrompt('create-custom-steering', {
      description: 'API design patterns and best practices',
      steeringPath: '/snapshot/test/.codex/steering'
    });

    expect(result).toContain('Create Custom Steering Document');
    expect(result).toContain('API design patterns and best practices');
    expect(result).toContain('/snapshot/test/.codex/steering');
  });

  test('refine steering prompt snapshot', () => {
    const result = promptLoader.renderPrompt('refine-steering', {
      filePath: '/snapshot/test/.codex/steering/api-guidelines.md'
    });

    expect(result).toMatchSnapshot();
  });

  test('delete steering prompt snapshot', () => {
    const result = promptLoader.renderPrompt('delete-steering', {
      documentName: 'deprecated-guidelines.md',
      steeringPath: '/snapshot/test/.codex/steering'
    });

    expect(result).toMatchSnapshot();
  });
});
