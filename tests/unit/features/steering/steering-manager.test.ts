import * as vscode from 'vscode';
import { SteeringManager } from '../../../../src/features/steering/steering-manager';
import { CodexProvider } from '../../../../src/providers/codex-provider';

// Mock vscode
jest.mock('vscode', () => ({
  window: {
    showInputBox: jest.fn(),
    showErrorMessage: jest.fn(),
    withProgress: jest.fn(),
    showWarningMessage: jest.fn()
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    fs: {
      createDirectory: jest.fn(),
      readDirectory: jest.fn(),
      stat: jest.fn(),
      delete: jest.fn(),
      writeFile: jest.fn()
    },
    openTextDocument: jest.fn()
  },
  Uri: {
    file: jest.fn((p) => ({ fsPath: p }))
  },
  FileType: { File: 1, Directory: 2 },
  ProgressLocation: { Notification: 15 }
}));

// Mock CodexProvider
jest.mock('../../../../src/providers/codex-provider');

// Mock NotificationUtils
jest.mock('../../../../src/utils/notification-utils', () => ({
  NotificationUtils: {
    showAutoDismissNotification: jest.fn()
  }
}));

// Mock PromptLoader
const renderPromptMock = jest.fn(() => 'mocked prompt content');
jest.mock('../../../../src/services/prompt-loader', () => ({
  PromptLoader: {
    getInstance: jest.fn(() => ({
      renderPrompt: renderPromptMock
    }))
  }
}));

// Mock ConfigManager
const getPathMock = jest.fn((key: string) => (key === 'steering' ? '.codex/steering' : ''));
jest.mock('../../../../src/utils/config-manager', () => ({
  ConfigManager: {
    getInstance: jest.fn(() => ({
      loadSettings: jest.fn(),
      getPath: getPathMock
    }))
  }
}));

describe('SteeringManager.createProjectDocumentation', () => {
  let steeringManager: SteeringManager;
  let mockCodexProvider: jest.Mocked<CodexProvider>;
  let mockOutputChannel: any;

  beforeEach(() => {
    mockOutputChannel = {
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn()
    };

    mockCodexProvider = {
      invokeCodexSplitView: jest.fn().mockResolvedValue({} as any),
      getCodexConfig: jest.fn(() => ({ defaultApprovalMode: 'interactive' }))
    } as unknown as jest.Mocked<CodexProvider>;

    steeringManager = new SteeringManager(mockCodexProvider, mockOutputChannel);
    renderPromptMock.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create-agents-md prompt with correct variables and invokes Codex', async () => {
    await steeringManager.createProjectDocumentation();

    expect(renderPromptMock).toHaveBeenCalledWith('create-agents-md', {
      steeringPath: '.codex/steering',
      constantsPath: 'src/constants.ts'
    });

    expect(mockCodexProvider.invokeCodexSplitView).toHaveBeenCalledWith(
      'mocked prompt content',
      'Codex -Create AGENTS.md'
    );
  });
});

