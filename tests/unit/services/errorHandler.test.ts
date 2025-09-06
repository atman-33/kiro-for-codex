import * as vscode from 'vscode';
import { CodexErrorHandler, ErrorSeverity, ErrorType } from '../../../src/services/errorHandler';

// Mock vscode module
jest.mock('vscode', () => ({
  window: {
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    setStatusBarMessage: jest.fn(),
    createTerminal: jest.fn(),
  },
  workspace: {
    getConfiguration: jest.fn(),
    openTextDocument: jest.fn(),
  },
  env: {
    openExternal: jest.fn(),
    clipboard: {
      writeText: jest.fn(),
    },
  },
  commands: {
    executeCommand: jest.fn(),
  },
  Uri: {
    parse: jest.fn(),
  },
  ConfigurationTarget: {
    Global: 1,
  },
}));

describe('CodexErrorHandler', () => {
  let errorHandler: CodexErrorHandler;
  let mockOutputChannel: vscode.OutputChannel;

  beforeEach(() => {
    mockOutputChannel = {
      appendLine: jest.fn(),
      append: jest.fn(),
      replace: jest.fn(),
      clear: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn(),
      name: 'test',
    } as any;

    errorHandler = new CodexErrorHandler(mockOutputChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeError', () => {
    it('should detect installation errors', () => {
      const error = new Error('command not found: codex');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.CLI_NOT_INSTALLED);
      expect(result.severity).toBe(ErrorSeverity.CRITICAL);
      expect(result.isRetryable).toBe(false);
      expect(result.troubleshootingSteps).toContain('Install Codex CLI using the official installer');
    });

    it('should detect permission errors', () => {
      const error = new Error('EACCES: permission denied');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.PERMISSION_DENIED);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.isRetryable).toBe(false);
      expect(result.troubleshootingSteps).toContain('Check file permissions for Codex CLI executable');
    });

    it('should detect timeout errors', () => {
      const error = new Error('Operation timed out after 30000ms');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.TIMEOUT);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.isRetryable).toBe(true);
      expect(result.troubleshootingSteps).toContain('Check your internet connection');
    });

    it('should detect authentication errors', () => {
      const error = new Error('Authentication failed: invalid api key');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.AUTH_FAILED);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.isRetryable).toBe(false);
      expect(result.troubleshootingSteps).toContain('Check your API key configuration');
    });

    it('should detect rate limit errors', () => {
      const error = new Error('Rate limit exceeded: too many requests');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.RATE_LIMITED);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.isRetryable).toBe(true);
      expect(result.troubleshootingSteps).toContain('Wait a few minutes before retrying');
    });

    it('should detect network errors', () => {
      const error = new Error('ECONNREFUSED: connection refused');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.isRetryable).toBe(true);
      expect(result.troubleshootingSteps).toContain('Check your internet connection');
    });

    it('should detect file access errors', () => {
      const error = new Error('ENOENT: no such file or directory, open \'test.txt\'');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.FILE_ACCESS_ERROR);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.isRetryable).toBe(true);
      expect(result.troubleshootingSteps).toContain('Check file permissions in the workspace');
    });

    it('should detect configuration errors', () => {
      const error = new Error('Invalid configuration: unknown flag --invalid');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.CONFIG_ERROR);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.isRetryable).toBe(false);
      expect(result.troubleshootingSteps).toContain('Check Codex CLI configuration settings');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Some unexpected error');
      const result = errorHandler.analyzeError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.isRetryable).toBe(true);
      expect(result.troubleshootingSteps).toContain('Try the operation again');
    });

    it('should include context in error analysis', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', attempt: 1 };
      const result = errorHandler.analyzeError(error, context);

      expect(result.context).toEqual(context);
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(operation, 'test operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(operation, 'test operation', {
        maxAttempts: 2,
        baseDelay: 10, // Short delay for testing
        retryableErrors: [ErrorType.TIMEOUT]
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('command not found'));

      await expect(errorHandler.executeWithRetry(operation, 'test operation', {
        maxAttempts: 3,
        baseDelay: 10,
        retryableErrors: [ErrorType.TIMEOUT] // Installation error is not in this list
      })).rejects.toThrow('Codex CLI is not installed or not found in PATH');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('timeout'));

      await expect(errorHandler.executeWithRetry(operation, 'test operation', {
        maxAttempts: 2,
        baseDelay: 10,
        retryableErrors: [ErrorType.TIMEOUT]
      })).rejects.toThrow('Codex CLI operation timed out');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('showErrorToUser', () => {
    it('should show error message with appropriate severity', async () => {
      const codexError = {
        type: ErrorType.CLI_NOT_INSTALLED,
        severity: ErrorSeverity.CRITICAL,
        message: 'Test error message',
        isRetryable: false,
        troubleshootingSteps: ['Step 1', 'Step 2'],
        actionButtons: []
      };

      (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);

      await errorHandler.showErrorToUser(codexError);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Test error message',
        'Show Details',
        'Copy Error'
      );
    });

    it('should handle action button clicks', async () => {
      const mockAction = jest.fn();
      const codexError = {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        message: 'Test timeout',
        isRetryable: true,
        troubleshootingSteps: ['Step 1'],
        actionButtons: [
          {
            label: 'Custom Action',
            action: mockAction,
            isPrimary: true
          }
        ]
      };

      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Custom Action');

      await errorHandler.showErrorToUser(codexError);

      expect(mockAction).toHaveBeenCalled();
    });
  });
});