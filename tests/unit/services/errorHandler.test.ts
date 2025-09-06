import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { CodexErrorHandler, ErrorSeverity, ErrorType } from '../../../src/services/errorHandler';

describe('CodexErrorHandler', () => {
  let errorHandler: CodexErrorHandler;
  let mockOutputChannel: jest.Mocked<vscode.OutputChannel>;

  beforeEach(() => {
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

    errorHandler = new CodexErrorHandler(mockOutputChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Analysis', () => {
    it('should detect installation errors', () => {
      const error = new Error('command not found: codex');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.CLI_NOT_INSTALLED);
      expect(codexError.severity).toBe(ErrorSeverity.CRITICAL);
      expect(codexError.isRetryable).toBe(false);
      expect(codexError.troubleshootingSteps).toContain('Install Codex CLI using the official installer');
    });

    it('should detect permission errors', () => {
      const error = new Error('EACCES: permission denied');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.PERMISSION_DENIED);
      expect(codexError.severity).toBe(ErrorSeverity.HIGH);
      expect(codexError.isRetryable).toBe(false);
      expect(codexError.troubleshootingSteps).toContain('Check file permissions for Codex CLI executable');
    });

    it('should detect timeout errors', () => {
      const error = new Error('Operation timed out after 30000ms');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.TIMEOUT);
      expect(codexError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(codexError.isRetryable).toBe(true);
      expect(codexError.troubleshootingSteps).toContain('Check your internet connection');
    });

    it('should detect authentication errors', () => {
      const error = new Error('Authentication failed: invalid api key');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.AUTH_FAILED);
      expect(codexError.severity).toBe(ErrorSeverity.HIGH);
      expect(codexError.isRetryable).toBe(false);
      expect(codexError.troubleshootingSteps).toContain('Check your API key configuration');
    });

    it('should detect rate limit errors', () => {
      const error = new Error('Rate limit exceeded: too many requests');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.RATE_LIMITED);
      expect(codexError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(codexError.isRetryable).toBe(true);
      expect(codexError.troubleshootingSteps).toContain('Wait a few minutes before retrying');
    });

    it('should detect network errors', () => {
      const error = new Error('ECONNREFUSED: connection refused');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.NETWORK_ERROR);
      expect(codexError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(codexError.isRetryable).toBe(true);
      expect(codexError.troubleshootingSteps).toContain('Check your internet connection');
    });

    it('should detect file access errors', () => {
      const error = new Error('ENOENT: no such file or directory, open \'/tmp/test.txt\'');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.FILE_ACCESS_ERROR);
      expect(codexError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(codexError.isRetryable).toBe(true);
      expect(codexError.troubleshootingSteps).toContain('Check file permissions in the workspace');
    });

    it('should detect configuration errors', () => {
      const error = new Error('Invalid configuration: unknown flag --invalid');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.CONFIG_ERROR);
      expect(codexError.severity).toBe(ErrorSeverity.HIGH);
      expect(codexError.isRetryable).toBe(false);
      expect(codexError.troubleshootingSteps).toContain('Check Codex CLI configuration settings');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Some unknown error occurred');
      const codexError = errorHandler.analyzeError(error);

      expect(codexError.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(codexError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(codexError.isRetryable).toBe(true);
      expect(codexError.troubleshootingSteps).toContain('Try the operation again');
    });

    it('should handle string errors', () => {
      const errorMessage = 'String error message';
      const codexError = errorHandler.analyzeError(errorMessage);

      expect(codexError.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(codexError.message).toContain(errorMessage);
    });

    it('should include context in error analysis', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', attempt: 1 };
      const codexError = errorHandler.analyzeError(error, context);

      expect(codexError.context).toEqual(context);
    });
  });

  describe('Error Display', () => {
    it('should show critical errors as error messages', async () => {
      const codexError = {
        type: ErrorType.CLI_NOT_INSTALLED,
        severity: ErrorSeverity.CRITICAL,
        message: 'Codex CLI is not installed',
        isRetryable: false,
        troubleshootingSteps: ['Install Codex CLI'],
        actionButtons: [],
      };

      (vscode.window.showErrorMessage as any).mockResolvedValue('Show Details');

      await errorHandler.showErrorToUser(codexError);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Codex CLI is not installed'),
        'Show Details',
        'Copy Error'
      );
    });

    it('should show medium severity errors as warnings', async () => {
      const codexError = {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        message: 'Operation timed out',
        isRetryable: true,
        troubleshootingSteps: ['Check connection'],
        actionButtons: [],
      };

      (vscode.window.showWarningMessage as any).mockResolvedValue(undefined);

      await errorHandler.showErrorToUser(codexError);

      expect(vscode.window.showWarningMessage).toHaveBeenCalled();
    });

    it('should show low severity errors as information', async () => {
      const codexError = {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Minor issue occurred',
        isRetryable: true,
        troubleshootingSteps: ['Try again'],
        actionButtons: [],
      };

      (vscode.window.showInformationMessage as any).mockResolvedValue(undefined);

      await errorHandler.showErrorToUser(codexError);

      expect(vscode.window.showInformationMessage).toHaveBeenCalled();
    });

    it('should handle action button clicks', async () => {
      const mockAction = jest.fn() as jest.MockedFunction<() => Promise<void>>;
      const codexError = {
        type: ErrorType.CLI_NOT_INSTALLED,
        severity: ErrorSeverity.CRITICAL,
        message: 'Codex CLI is not installed',
        isRetryable: false,
        troubleshootingSteps: ['Install Codex CLI'],
        actionButtons: [
          {
            label: 'Install',
            action: mockAction,
            isPrimary: true,
          },
        ],
      };

      (vscode.window.showErrorMessage as any).mockResolvedValue('Install');

      await errorHandler.showErrorToUser(codexError);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should handle Show Details action', async () => {
      const codexError = {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Test error',
        originalError: new Error('Original error'),
        isRetryable: true,
        troubleshootingSteps: ['Step 1', 'Step 2'],
        actionButtons: [],
      };

      (vscode.window.showWarningMessage as any).mockResolvedValue('Show Details');
      (vscode.workspace.openTextDocument as any).mockResolvedValue({});
      (vscode.window.showTextDocument as any).mockResolvedValue({});

      await errorHandler.showErrorToUser(codexError);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({
        content: expect.stringContaining('# Codex Error Details'),
        language: 'markdown',
      });
    });

    it('should handle Copy Error action', async () => {
      const codexError = {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        message: 'Operation timed out',
        isRetryable: true,
        troubleshootingSteps: ['Check connection'],
        actionButtons: [],
      };

      (vscode.window.showWarningMessage as any).mockResolvedValue('Copy Error');
      (vscode.env.clipboard.writeText as any).mockResolvedValue(undefined);

      await errorHandler.showErrorToUser(codexError);

      expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Codex Error: TIMEOUT')
      );
    });
  });

  describe('Retry Logic', () => {
    it('should execute operation with retry on retryable errors', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Operation timed out');
        }
        return 'success';
      }) as jest.MockedFunction<() => Promise<string>>;

      const result = await errorHandler.executeWithRetry(
        operation,
        'Test Operation',
        {
          maxAttempts: 3,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        }
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockImplementation(async () => {
        throw new Error('command not found: codex');
      }) as jest.MockedFunction<() => Promise<string>>;

      await expect(
        errorHandler.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 3,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum attempts', async () => {
      const operation = jest.fn().mockImplementation(async () => {
        throw new Error('Operation timed out');
      }) as jest.MockedFunction<() => Promise<string>>;

      await expect(
        errorHandler.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff delay', async () => {
      const operation = jest.fn().mockImplementation(async () => {
        throw new Error('Operation timed out');
      }) as jest.MockedFunction<() => Promise<string>>;

      const startTime = Date.now();

      await expect(
        errorHandler.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 100,
          backoffMultiplier: 2,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have waited at least the base delay
      expect(duration).toBeGreaterThan(90);
    });
  });

  describe('Logging', () => {
    it('should log error analysis', () => {
      const error = new Error('Test error');
      errorHandler.analyzeError(error);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Analyzing error: Test error')
      );
    });

    it('should log retry attempts', async () => {
      const operation = jest.fn().mockImplementation(async () => {
        throw new Error('Operation timed out');
      }) as jest.MockedFunction<() => Promise<string>>;

      await expect(
        errorHandler.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Executing Test Operation (attempt 1/2)')
      );
    });

    it('should log successful retry', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Operation timed out');
        }
        return 'success';
      }) as jest.MockedFunction<() => Promise<string>>;

      await errorHandler.executeWithRetry(operation, 'Test Operation', {
        maxAttempts: 3,
        baseDelay: 10,
        retryableErrors: [ErrorType.TIMEOUT],
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test Operation succeeded on attempt 2')
      );
    });
  });
});