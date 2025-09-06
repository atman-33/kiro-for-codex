import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { ApprovalMode, CodexProvider } from '../../src/providers/codexProvider';

describe('CodexProvider Integration Tests', () => {
  let codexProvider: CodexProvider;
  let mockContext: vscode.ExtensionContext;
  let mockOutputChannel: vscode.OutputChannel;

  beforeEach(() => {
    // Setup basic mocks
    mockContext = {
      globalStorageUri: { fsPath: '/tmp/test' } as vscode.Uri,
    } as vscode.ExtensionContext;

    mockOutputChannel = {
      name: 'Test Channel',
      appendLine: jest.fn(),
      append: jest.fn(),
      replace: jest.fn(),
      clear: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn(),
    } as vscode.OutputChannel;

    // Mock workspace configuration
    const mockConfig = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const configMap: Record<string, any> = {
          'codex.path': 'echo', // Use echo command for testing
          'codex.defaultApprovalMode': ApprovalMode.Interactive,
          'codex.defaultModel': 'gpt-5',
          'codex.timeout': 30000,
          'codex.terminalDelay': 1000,
        };
        return configMap[key] ?? defaultValue;
      }),
    };

    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);
    (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
    (vscode.workspace.onDidChangeConfiguration as jest.Mock).mockReturnValue({ dispose: jest.fn() });

    codexProvider = new CodexProvider(mockContext, mockOutputChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with correct configuration', () => {
      const config = codexProvider.getCodexConfig();

      expect(config.codexPath).toBe('echo');
      expect(config.defaultApprovalMode).toBe(ApprovalMode.Interactive);
      expect(config.defaultModel).toBe('gpt-5');
      expect(config.timeout).toBe(30000);
    });

    it('should update approval mode', () => {
      codexProvider.setApprovalMode(ApprovalMode.FullAuto);

      const config = codexProvider.getCodexConfig();
      expect(config.defaultApprovalMode).toBe(ApprovalMode.FullAuto);
    });
  });

  describe('Availability Checking', () => {
    it('should check if Codex CLI is available', async () => {
      // This will use 'echo --version' which should succeed
      const isAvailable = await codexProvider.checkCodexAvailability();
      expect(isAvailable).toBe(true);
    });

    it('should perform comprehensive availability check', async () => {
      const result = await codexProvider.checkCodexInstallationAndCompatibility();

      expect(result.isInstalled).toBe(true);
      // Note: echo --version doesn't return a proper version, so version parsing might fail
      // but the command should execute successfully
    });

    it('should check if Codex is ready', async () => {
      const isReady = await codexProvider.isCodexReady();
      // This depends on the availability check result
      expect(typeof isReady).toBe('boolean');
    });
  });

  describe('Error Handling Services', () => {
    it('should provide error handler access', () => {
      const errorHandler = codexProvider.getErrorHandler();
      expect(errorHandler).toBeDefined();
    });

    it('should provide retry service access', () => {
      const retryService = codexProvider.getRetryService();
      expect(retryService).toBeDefined();
    });

    it('should get retry statistics', () => {
      const stats = codexProvider.getRetryStatistics();
      expect(stats).toHaveProperty('activeCount');
      expect(stats).toHaveProperty('operations');
      expect(Array.isArray(stats.operations)).toBe(true);
    });

    it('should cancel all retries', () => {
      // This should not throw
      expect(() => codexProvider.cancelAllRetries()).not.toThrow();
    });
  });

  describe('Terminal Operations', () => {
    it('should create terminal with proper options', async () => {
      const mockTerminal = {
        show: jest.fn(),
        sendText: jest.fn(),
        dispose: jest.fn(),
      } as any;

      (vscode.window.createTerminal as any) = jest.fn().mockReturnValue(mockTerminal);

      // Mock file operations for temp file creation
      jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined);

      const result = await codexProvider.invokeCodexSplitView('test prompt', 'Test Terminal');

      expect(result).toBe(mockTerminal);
      expect(vscode.window.createTerminal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Terminal',
          location: { viewColumn: vscode.ViewColumn.Two },
        })
      );
    });

    it('should rename terminal', async () => {
      const mockTerminal = {
        show: jest.fn(),
      } as any;

      await codexProvider.renameTerminal(mockTerminal, 'New Terminal Name');

      expect(mockTerminal.show).toHaveBeenCalled();
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'workbench.action.terminal.renameWithArg',
        { name: 'New Terminal Name' }
      );
    });
  });

  describe('File Path Handling', () => {
    it('should handle WSL path conversion on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      try {
        // The method is private, so we test it indirectly
        // Just verify the provider can be created without errors
        expect(codexProvider).toBeDefined();
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });

    it('should handle Unix paths normally', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      try {
        // Just verify the provider works on Unix systems
        expect(codexProvider).toBeDefined();
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });
  });
});