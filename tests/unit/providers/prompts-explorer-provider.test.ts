import * as path from 'path';
import { workspace, FileType } from 'vscode';
import { PromptsExplorerProvider } from '../../../src/providers/prompts-explorer-provider';

describe('PromptsExplorerProvider', () => {
  const wsRoot = '/mock/workspace';
  const baseDir = path.join(wsRoot, '.codex', 'prompts');

  beforeEach(() => {
    jest.resetModules();
    (workspace.fs.readDirectory as jest.Mock).mockReset();
  });

  test('returns prompt items that open files on click', async () => {
    // Arrange: mock directory structure
    (workspace.fs.readDirectory as jest.Mock).mockImplementation((uri: any) => {
      const p = uri.fsPath || uri.path;
      if (p === baseDir) {
        return Promise.resolve([
          ['a.md', FileType.File],
          ['nested', FileType.Directory]
        ]);
      }
      if (p === path.join(baseDir, 'nested')) {
        return Promise.resolve([
          ['b.md', FileType.File]
        ]);
      }
      return Promise.resolve([]);
    });

    const provider = new PromptsExplorerProvider({} as any, {} as any);

    // Act
    const children = await provider.getChildren();

    // Assert
    expect(children.length).toBe(2);
    for (const item of children) {
      expect(item.command?.command).toBe('vscode.open');
      expect(item.resourceUri).toBeTruthy();
      expect(item.contextValue).toBe('prompt');
    }
  });

  test('shows empty state when no prompts found', async () => {
    (workspace.fs.readDirectory as jest.Mock).mockResolvedValue([]);
    const provider = new PromptsExplorerProvider({} as any, {} as any);
    const items = await provider.getChildren();
    expect(items.length).toBe(1);
    expect(items[0].contextValue).toBe('prompts-empty');
  });
});

