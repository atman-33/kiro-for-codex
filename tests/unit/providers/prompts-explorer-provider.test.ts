import * as path from 'path';
import { vi, describe, test, expect, beforeEach, Mock } from 'vitest';
import { workspace, FileType, TreeItem, EventEmitter, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { PromptsExplorerProvider } from '../../../src/providers/prompts-explorer-provider';

vi.mock('vscode', () => {
  const workspace = {
    fs: {
      readDirectory: vi.fn(),
    },
    workspaceFolders: [{
      uri: { fsPath: '/mock/workspace' }
    }]
  };
  const FileType = {
    File: 1,
    Directory: 2,
    SymbolicLink: 64,
    Unknown: 0
  };
  class MockTreeItem {
    public command?: any;
    public resourceUri?: any;
    public contextValue?: string;
    public iconPath?: any;
    public tooltip?: string;
    constructor(public readonly label: string, public readonly collapsibleState: number) {}
  }
  class MockEventEmitter {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  }
  const TreeItemCollapsibleState = {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  };
  class MockThemeIcon {
    constructor(public readonly id: string) {}
  }
  return { workspace, FileType, Uri: { file: (p: string) => ({ fsPath: p, path: p }) }, TreeItem: MockTreeItem, EventEmitter: MockEventEmitter, TreeItemCollapsibleState, ThemeIcon: MockThemeIcon };
});

describe('PromptsExplorerProvider', () => {
  const wsRoot = '/mock/workspace';
  const baseDir = path.join(wsRoot, '.codex', 'prompts');

  beforeEach(() => {
    vi.resetModules();
    (workspace.fs.readDirectory as Mock).mockReset();
  });

  test('returns prompt items that open files on click', async () => {
    // Arrange: mock directory structure
    (workspace.fs.readDirectory as Mock).mockImplementation((uri: any) => {
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
    (workspace.fs.readDirectory as Mock).mockResolvedValue([]);
    const provider = new PromptsExplorerProvider({} as any, {} as any);
    const items = await provider.getChildren();
    expect(items.length).toBe(1);
    expect(items[0].contextValue).toBe('prompts-empty');
  });
});

