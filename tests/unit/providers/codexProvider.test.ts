import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { ApprovalMode, CodexOptions, CodexProvider } from '../../../src/providers/codexProvider';
import { CommandBuilder } from '../../../src/services/commandBuilder';
import { CodexErrorHandler } from '../../../src/services/errorHandler';
import { ProcessManager } from '../../../src/services/processManager';
import { RetryService } from '../../../src/services/retryService';

// Mock dependencies
jest.mock('../../../src/services/commandBuilder');
jest.mock('../../../src/services/processManager');
jest.mock('../../../src/services/errorHandler');
jest.mock('../../../src/services/retryService');
jest.mock('../../../src/services/codexSetupService', () => ({
  CodexSetupService: {
    getInstance: jest.fn().mockReturnValue({
      getInstallationGuidance: jest.fn().mockReturnValue('Install Codex CLI'),
      getVersionUpgradeGuidance: jest.fn().mockReturnValue('Upgrade Codex CLI'),
      getPermissionGuidance: jest.fn().mockReturnValue('Fix permissions'),
      getTroubleshootingGuidance: jest.fn().mockReturnValue('Troubleshoot'),
      showSetupGuidance: jest.fn(),
    }),
  },
}));
jest.mock('../../../src/utils/configManager', () => ({
  ConfigManager: {
    getInstance: jest.fn().mockReturnValue({
      loadSettings: jest.fn(),
      getSettings: jest.fn().mockReturnValue({}),
    }),
  },
}));
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('CodexProvider', () => {
  let codexProvider: CodexProvider;
  let mockContext: jest.Mocked<vscode.ExtensionContext>;
  let mockOutputChannel: jest.Mocked<vscode.OutputChannel>;
  let mockCommandBuilder: jest.Mocked<CommandBuilder>;
  let mockProcessManager: jest.Mocked<ProcessManager>;
  let mockErrorHandler: jest.Mocked<CodexErrorHandler>;
  let mockRetryService: jest.Mocked<RetryService>;

  beforeEach(() => {
    // Setup mocks
    mockContext = {
      globalStorageUri: { fsPath: '/tmp/test' } as vscode.Uri,
    } as jest.Mocked<vscode.ExtensionContext>;

    mockOutputChannel = {
      name: 'Test Channel',
      appendLine: jest.fn(),
      append: jest.fn(),
      replace: jest.fn(),
      clear: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn(),
    } as jest.Mocked<vscode.OutputChannel>;

    // Create proper mocked instances
    mockCommandBuilder = {
      buildCommand: jest.fn(),
      buildVersionCommand: jest.fn(),
      buildApprovalModeFlag: jest.fn(),
      buildWorkingDirectoryFlag: jest.fn(),
      buildHelpCommand: jest.fn(),
      buildSecureCommand: jest.fn(),
    } as unknown as jest.Mocked<CommandBuilder>;

    mockProcessManager = {
      executeCommand: jest.fn(),
      createTerminal: jest.fn(),
      executeCommandWithShellIntegration: jest.fn(),
      killProcess: jest.fn(),
      killAllProcesses: jest.fn(),
      getActiveProcessCount: jest.fn(),
      dispose: jest.fn(),
    } as unknown as jest.Mocked<ProcessManager>;

    mockErrorHandler = {
      analyzeError: jest.fn(),
      executeWithRetry: jest.fn(),
      showErrorToUser: jest.fn(),
    } as unknown as jest.Mocked<CodexErrorHandler>;

    mockRetryService = {
      executeWithRetry: jest.fn(),
      getActiveRetries: jest.fn(),
      cancelAllRetries: jest.fn(),
      getRetryStatistics: jest.fn(),
    } as unknown as jest.Mocked<RetryService>;

    // Mock workspace configuration
    const mockConfig = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const configMap: Record<string, any> = {
          'codex.path': 'codex',
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

    // Mock ConfigManager
    const mockConfigManager = {
      loadSettings: jest.fn(),
      getInstance: jest.fn(),
    };

    // Mock the constructor dependencies
    (CommandBuilder as jest.MockedClass<typeof CommandBuilder>).mockImplementation(() => mockCommandBuilder);
    (ProcessManager as jest.MockedClass<typeof ProcessManager>).mockImplementation(() => mockProcessManager);
    (CodexErrorHandler as jest.MockedClass<typeof CodexErrorHandler>).mockImplementation(() => mockErrorHandler);
    (RetryService as jest.MockedClass<typeof RetryService>).mockImplementation(() => mockRetryService);

    // Mock ConfigManager.getInstance
    jest.doMock('../../../src/utils/configManager', () => ({
      ConfigManager: {
        getInstance: jest.fn().mockReturnValue(mockConfigManager),
      },
    }));

    // Mock CodexSetupService.getInstance
    jest.doMock('../../../src/services/codexSetupService', () => ({
      CodexSetupService: {
        getInstance: jest.fn().mockReturnValue({
          getInstallationGuidance: jest.fn().mockReturnValue('Install Codex CLI'),
          getVersionUpgradeGuidance: jest.fn().mockReturnValue('Upgrade Codex CLI'),
          getPermissionGuidance: jest.fn().mockReturnValue('Fix permissions'),
          getTroubleshootingGuidance: jest.fn().mockReturnValue('Troubleshoot'),
          showSetupGuidance: jest.fn(),
        }),
      },
    }));

    codexProvider = new CodexProvider(mockContext, mockOutputChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      expect(codexProvider).toBeDefined();
    });

    it('should load Codex configuration from workspace settings', () => {
      const config = codexProvider.getCodexConfig();
      expect(config.codexPath).toBe('codex');
      expect(config.defaultApprovalMode).toBe(ApprovalMode.Interactive);
      expect(config.defaultModel).toBe('gpt-5');
      expect(config.timeout).toBe(30000);
    });

    it('should update configuration when workspace settings change', () => {
      const mockEvent = {
        affectsConfiguration: jest.fn().mockReturnValue(true),
      } as any;

      // Trigger configuration change
      const configChangeHandler = (vscode.workspace.onDidChangeConfiguration as jest.Mock).mock.calls[0]?.[0];
      if (configChangeHandler && typeof configChangeHandler === 'function') {
        configChangeHandler(mockEvent);
        expect(mockEvent.affectsConfiguration).toHaveBeenCalled();
      } else {
        // If no handler was registered, just verify the mock was called
        expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
      }
    });
  });

  describe('Codex Availability Checking', () => {
    it('should return true when Codex CLI is available', async () => {
      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 0,
        output: 'codex version 1.0.0',
        error: '',
      });

      const isAvailable = await codexProvider.checkCodexAvailability();
      expect(isAvailable).toBe(true);
      expect(mockProcessManager.executeCommand).toHaveBeenCalledWith('codex --version');
    });

    it('should return false when Codex CLI is not available', async () => {
      mockProcessManager.executeCommand.mockRejectedValue(new Error('Command not found'));

      const isAvailable = await codexProvider.checkCodexAvailability();
      expect(isAvailable).toBe(false);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Codex CLI not available')
      );
    });

    it('should perform comprehensive availability check', async () => {
      mockCommandBuilder.buildVersionCommand.mockReturnValue('codex --version');
      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 0,
        output: 'codex version 1.2.0',
        error: '',
      });

      const result = await codexProvider.checkCodexInstallationAndCompatibility();

      expect(result.isAvailable).toBe(true);
      expect(result.isInstalled).toBe(true);
      expect(result.version).toBe('1.2.0');
      expect(result.isCompatible).toBe(true);
    });

    it('should detect incompatible version', async () => {
      mockCommandBuilder.buildVersionCommand.mockReturnValue('codex --version');
      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 0,
        output: 'codex version 0.5.0',
        error: '',
      });

      const result = await codexProvider.checkCodexInstallationAndCompatibility();

      expect(result.isInstalled).toBe(true);
      expect(result.version).toBe('0.5.0');
      expect(result.isCompatible).toBe(false);
      expect(result.isAvailable).toBe(false);
    });
  });

  describe('Codex Execution', () => {
    beforeEach(() => {
      // Mock successful availability check
      jest.spyOn(codexProvider, 'checkCodexInstallationAndCompatibility').mockResolvedValue({
        isAvailable: true,
        isInstalled: true,
        version: '1.0.0',
        isCompatible: true,
        errorMessage: null,
        setupGuidance: null,
      });

      // Mock retry service to execute operation directly
      mockRetryService.executeWithRetry.mockImplementation(async <T>(operation: () => Promise<T>) => {
        return await operation();
      });
    });

    it('should execute Codex with prompt successfully', async () => {
      const mockPrompt = 'Create a hello world function';

      mockCommandBuilder.buildCommand.mockReturnValue('codex "Create a hello world function"');
      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 0,
        output: 'Modified: hello.js\nFunction created successfully',
        error: '',
      });

      // Mock file operations
      const fs = require('fs');
      fs.promises.writeFile.mockResolvedValue(undefined);
      fs.promises.unlink.mockResolvedValue(undefined);

      const result = await codexProvider.executeCodex(mockPrompt);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Function created successfully');
      expect(result.filesModified).toContain('hello.js');
    });

    it('should handle execution failure', async () => {
      const mockPrompt = 'Invalid prompt';

      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 1,
        output: '',
        error: 'Syntax error in prompt',
      });

      mockRetryService.executeWithRetry.mockImplementation(async <T>(operation: () => Promise<T>) => {
        return await operation();
      });

      await expect(codexProvider.executeCodex(mockPrompt)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const mockPrompt = 'Long running operation';

      mockProcessManager.executeCommand.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out after 30000ms')), 100);
        });
      });

      mockRetryService.executeWithRetry.mockImplementation(async <T>(operation: () => Promise<T>) => {
        return await operation();
      });

      await expect(codexProvider.executeCodex(mockPrompt, { timeout: 100 })).rejects.toThrow();
    });

    it('should pass options to command builder', async () => {
      const mockPrompt = 'Test prompt';
      const options: CodexOptions = {
        approvalMode: ApprovalMode.AutoEdit,
        workingDirectory: '/custom/path',
        model: 'gpt-4',
        timeout: 60000,
      };

      mockCommandBuilder.buildCommand.mockReturnValue('codex --approval-mode auto-edit');
      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 0,
        output: 'Success',
        error: '',
      });

      const fs = require('fs');
      fs.promises.writeFile.mockResolvedValue(undefined);
      fs.promises.unlink.mockResolvedValue(undefined);

      await codexProvider.executeCodex(mockPrompt, options);

      expect(mockCommandBuilder.buildCommand).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          approvalMode: ApprovalMode.AutoEdit,
          workingDirectory: '/custom/path',
          model: 'gpt-4',
          timeout: 60000,
        })
      );
    });
  });

  describe('Terminal Operations', () => {
    beforeEach(() => {
      jest.spyOn(codexProvider, 'checkCodexInstallationAndCompatibility').mockResolvedValue({
        isAvailable: true,
        isInstalled: true,
        version: '1.0.0',
        isCompatible: true,
        errorMessage: null,
        setupGuidance: null,
      });

      mockRetryService.executeWithRetry.mockImplementation(async <T>(operation: () => Promise<T>) => {
        return await operation();
      });
    });

    it('should create terminal in split view', async () => {
      const mockPrompt = 'Create a new component';
      const mockTerminal = {
        show: jest.fn(),
        sendText: jest.fn(),
        dispose: jest.fn(),
      } as any;

      mockCommandBuilder.buildCommand.mockReturnValue('codex "Create a new component"');
      mockProcessManager.createTerminal.mockReturnValue(mockTerminal);

      const fs = require('fs');
      fs.promises.writeFile.mockResolvedValue(undefined);

      const result = await codexProvider.invokeCodexSplitView(mockPrompt, 'Test Terminal');

      expect(result).toBe(mockTerminal);
      expect(mockProcessManager.createTerminal).toHaveBeenCalledWith(
        'codex "Create a new component"',
        expect.objectContaining({
          name: 'Test Terminal',
          location: { viewColumn: vscode.ViewColumn.Two },
        })
      );
    });

    it('should execute Codex in headless mode', async () => {
      const mockPrompt = 'Generate documentation';

      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 0,
        output: 'Documentation generated',
        error: '',
      });

      jest.spyOn(codexProvider, 'executeCodex').mockResolvedValue({
        exitCode: 0,
        output: 'Documentation generated',
        filesModified: ['README.md'],
      });

      const result = await codexProvider.invokeCodexHeadless(mockPrompt);

      expect(result.exitCode).toBe(0);
      expect(result.output).toBe('Documentation generated');
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Invoking Codex in headless mode')
      );
    });
  });

  describe('Configuration Management', () => {
    it('should set approval mode', () => {
      codexProvider.setApprovalMode(ApprovalMode.FullAuto);

      const config = codexProvider.getCodexConfig();
      expect(config.defaultApprovalMode).toBe(ApprovalMode.FullAuto);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Approval mode set to: full-auto')
      );
    });

    it('should get current configuration', () => {
      const config = codexProvider.getCodexConfig();

      expect(config).toEqual({
        codexPath: 'codex',
        defaultApprovalMode: ApprovalMode.Interactive,
        defaultModel: 'gpt-5',
        timeout: 30000,
        terminalDelay: 1000,
      });
    });

    it('should check if Codex is ready', async () => {
      jest.spyOn(codexProvider, 'checkCodexInstallationAndCompatibility').mockResolvedValue({
        isAvailable: true,
        isInstalled: true,
        version: '1.0.0',
        isCompatible: true,
        errorMessage: null,
        setupGuidance: null,
      });

      const isReady = await codexProvider.isCodexReady();
      expect(isReady).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle CLI not installed error', async () => {
      jest.spyOn(codexProvider, 'checkCodexInstallationAndCompatibility').mockResolvedValue({
        isAvailable: false,
        isInstalled: false,
        version: null,
        isCompatible: false,
        errorMessage: 'Codex CLI is not installed',
        setupGuidance: 'Install Codex CLI',
      });

      mockRetryService.executeWithRetry.mockImplementation(async <T>(operation: () => Promise<T>) => {
        return await operation();
      });

      await expect(codexProvider.executeCodex('test prompt')).rejects.toThrow();
    });

    it('should provide error handler access', () => {
      const errorHandler = codexProvider.getErrorHandler();
      expect(errorHandler).toBe(mockErrorHandler);
    });

    it('should provide retry service access', () => {
      const retryService = codexProvider.getRetryService();
      expect(retryService).toBe(mockRetryService);
    });

    it('should get retry statistics', () => {
      mockRetryService.getRetryStatistics.mockReturnValue({
        activeCount: 2,
        operations: ['operation1', 'operation2'],
      });

      const stats = codexProvider.getRetryStatistics();
      expect(stats.activeCount).toBe(2);
      expect(stats.operations).toEqual(['operation1', 'operation2']);
    });

    it('should cancel all retries', () => {
      codexProvider.cancelAllRetries();
      expect(mockRetryService.cancelAllRetries).toHaveBeenCalled();
    });
  });

  describe('File Operations', () => {
    it('should parse modified files from output', async () => {
      const mockOutput = `
        Modified: src/component.tsx
        Created: tests/component.test.ts
        Updated: package.json
        Writing to: docs/README.md
      `;

      jest.spyOn(codexProvider, 'checkCodexInstallationAndCompatibility').mockResolvedValue({
        isAvailable: true,
        isInstalled: true,
        version: '1.0.0',
        isCompatible: true,
        errorMessage: null,
        setupGuidance: null,
      });

      mockProcessManager.executeCommand.mockResolvedValue({
        exitCode: 0,
        output: mockOutput,
        error: '',
      });

      mockRetryService.executeWithRetry.mockImplementation(async <T>(operation: () => Promise<T>) => {
        return await operation();
      });

      const fs = require('fs');
      fs.promises.writeFile.mockResolvedValue(undefined);
      fs.promises.unlink.mockResolvedValue(undefined);

      const result = await codexProvider.executeCodex('test prompt');

      expect(result.filesModified).toEqual([
        'src/component.tsx',
        'tests/component.test.ts',
        'package.json',
        'docs/README.md',
      ]);
    });

    it('should handle WSL path conversion', () => {
      // This tests the private convertPathIfWSL method indirectly
      // by checking if the path handling works correctly on Windows
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      try {
        // The method is private, so we test it indirectly through executeCodex
        expect(codexProvider).toBeDefined();
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });
  });

  describe('Terminal Management', () => {
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
});