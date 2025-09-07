import * as vscode from 'vscode';
import { SpecManager } from '../../../../src/features/spec/spec-manager';
import { CodexProvider } from '../../../../src/providers/codex-provider';

// Mock vscode
jest.mock('vscode', () => ({
  window: {
    showInputBox: jest.fn(),
    showErrorMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn()
    })),
    withProgress: jest.fn()
  },
  workspace: {
    workspaceFolders: [{
      uri: { fsPath: '/test/workspace' }
    }],
    fs: {
      createDirectory: jest.fn(),
      readDirectory: jest.fn(),
      stat: jest.fn(),
      delete: jest.fn()
    },
    createFileSystemWatcher: jest.fn(() => ({
      onDidCreate: jest.fn(),
      dispose: jest.fn()
    })),
    openTextDocument: jest.fn()
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path })),
    joinPath: jest.fn()
  },
  FileType: {
    Directory: 2
  },
  ViewColumn: {
    Two: 2,
    Active: -1
  },
  RelativePattern: jest.fn(),
  ProgressLocation: {
    Notification: 15
  }
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
jest.mock('../../../../src/services/prompt-loader', () => ({
  PromptLoader: {
    getInstance: jest.fn(() => ({
      renderPrompt: jest.fn(() => 'mocked prompt content')
    }))
  }
}));

describe('SpecManager with CodexProvider Integration', () => {
  let specManager: SpecManager;
  let mockCodexProvider: jest.Mocked<CodexProvider>;
  let mockOutputChannel: any;

  beforeEach(() => {
    mockOutputChannel = {
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn()
    };

    mockCodexProvider = {
      isCodexReady: jest.fn(),
      getCodexAvailabilityStatus: jest.fn(),
      showSetupGuidance: jest.fn(),
      getCodexConfig: jest.fn(),
      invokeCodexSplitView: jest.fn(),
      renameTerminal: jest.fn(),
      setApprovalMode: jest.fn()
    } as any;

    specManager = new SpecManager(mockCodexProvider, mockOutputChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Codex Integration', () => {
    it('should check Codex availability before creating spec', async () => {
      // Arrange
      mockCodexProvider.isCodexReady.mockResolvedValue(false);
      mockCodexProvider.getCodexAvailabilityStatus.mockResolvedValue({
        isAvailable: false,
        isInstalled: false,
        version: null,
        isCompatible: false,
        errorMessage: 'Codex CLI not found',
        setupGuidance: 'Please install Codex CLI'
      });

      (vscode.window.showInputBox as jest.Mock).mockResolvedValue('Test feature');

      // Act
      await specManager.create();

      // Assert
      expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
      expect(mockCodexProvider.getCodexAvailabilityStatus).toHaveBeenCalled();
      expect(mockCodexProvider.showSetupGuidance).toHaveBeenCalled();
      expect(mockCodexProvider.invokeCodexSplitView).not.toHaveBeenCalled();
    });

    it('should use CodexProvider when Codex is ready', async () => {
      // Arrange
      mockCodexProvider.isCodexReady.mockResolvedValue(true);
      mockCodexProvider.getCodexConfig.mockReturnValue({
        codexPath: 'codex',
        defaultApprovalMode: 'interactive' as any,
        defaultModel: 'gpt-5',
        timeout: 30000,
        terminalDelay: 1000
      });
      mockCodexProvider.invokeCodexSplitView.mockResolvedValue({} as any);

      (vscode.window.showInputBox as jest.Mock).mockResolvedValue('Test feature');

      // Act
      await specManager.create();

      // Assert
      expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
      expect(mockCodexProvider.invokeCodexSplitView).toHaveBeenCalledWith(
        expect.any(String),
        'Codex -Creating Spec'
      );
    });

    it('should use Codex-specific prompts for task implementation', async () => {
      // Arrange
      mockCodexProvider.isCodexReady.mockResolvedValue(true);
      mockCodexProvider.getCodexConfig.mockReturnValue({
        codexPath: 'codex',
        defaultApprovalMode: 'interactive' as any,
        defaultModel: 'gpt-5',
        timeout: 30000,
        terminalDelay: 1000
      });
      mockCodexProvider.invokeCodexSplitView.mockResolvedValue({} as any);

      // Act
      await specManager.implTask('/test/tasks.md', 'Test task description');

      // Assert
      expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
      expect(mockCodexProvider.invokeCodexSplitView).toHaveBeenCalledWith(
        expect.any(String),
        'Codex -Implementing Task'
      );
    });

    it('should provide Codex status information', async () => {
      // Arrange
      mockCodexProvider.isCodexReady.mockResolvedValue(true);
      mockCodexProvider.getCodexConfig.mockReturnValue({
        codexPath: 'codex',
        defaultApprovalMode: 'interactive' as any,
        defaultModel: 'gpt-5',
        timeout: 30000,
        terminalDelay: 1000
      });

      // Act
      const status = await specManager.getCodexStatus();

      // Assert
      expect(status.isReady).toBe(true);
      expect(status.config).toBeDefined();
      expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
      expect(mockCodexProvider.getCodexConfig).toHaveBeenCalled();
    });

    it('should set Codex approval mode', () => {
      // Act
      specManager.setCodexApprovalMode('auto-edit');

      // Assert
      expect(mockCodexProvider.setApprovalMode).toHaveBeenCalledWith('auto-edit');
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[SpecManager] Codex approval mode set to: auto-edit'
      );
    });
  });
});
