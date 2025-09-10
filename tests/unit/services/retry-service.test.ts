import { afterEach, beforeEach, describe, expect, it, vi, Mocked } from 'vitest';
import * as vscode from 'vscode';
import { CodexErrorHandler, ErrorType } from '../../../src/services/error-handler';
import { RetryService } from '../../../src/services/retry-service';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    setStatusBarMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  },
}));

describe('RetryService', () => {
  let retryService: RetryService;
  let mockErrorHandler: Mocked<CodexErrorHandler>;
  let mockOutputChannel: Mocked<vscode.OutputChannel>;

  beforeEach(() => {
    mockOutputChannel = {
      name: 'Test Channel',
      appendLine: vi.fn(),
      append: vi.fn(),
      replace: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    } as any;

    mockErrorHandler = {
      analyzeError: vi.fn(),
      executeWithRetry: vi.fn(),
      showErrorToUser: vi.fn(),
    } as unknown as Mocked<CodexErrorHandler>;

    retryService = new RetryService(mockErrorHandler, mockOutputChannel);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Retry Logic', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = vi.fn<[], Promise<string>>().mockResolvedValue('success');

      const result = await retryService.executeWithRetry(
        operation,
        'Test Operation'
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Executing Test Operation (attempt 1/3)')
      );
    });

    it('should retry on retryable errors', async () => {
      let attemptCount = 0;
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Timeout error');
        }
        return Promise.resolve('success');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      const result = await retryService.executeWithRetry(
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
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test Operation succeeded on attempt 3')
      );
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.PERMISSION_DENIED,
        severity: 'high' as any,
        message: 'Permission denied',
        isRetryable: false,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 3,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow('Permission denied');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum attempts', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow('Timeout error');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Configuration', () => {
    it('should use custom retry options', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Network error');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.NETWORK_ERROR,
        severity: 'medium' as any,
        message: 'Network error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 5,
          baseDelay: 50,
          backoffMultiplier: 3,
          retryableErrors: [ErrorType.NETWORK_ERROR],
        })
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(5);
    });

    it('should apply exponential backoff', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      const startTime = Date.now();

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
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

    it('should respect maximum delay', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 100, // Lower than base delay * backoff
          backoffMultiplier: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      // Should still complete relatively quickly due to maxDelay
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Callback Handling', () => {
    it('should call onRetry callback', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      const onRetry = vi.fn<(attempt: number, error: Error) => void>();

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
          onRetry,
        })
      ).rejects.toThrow();

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should call onSuccess callback', async () => {
      let attemptCount = 0;
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Timeout error');
        }
        return Promise.resolve('success');
      });

      const onSuccess = vi.fn<(result: string, attempts: number) => void>();

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      const result = await retryService.executeWithRetry(
        operation,
        'Test Operation',
        {
          maxAttempts: 3,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
          onSuccess,
        }
      );

      expect(result).toBe('success');
      expect(onSuccess).toHaveBeenCalledWith('success', 2);
    });

    it('should call onFailure callback', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      const onFailure = vi.fn<(error: Error, attempts: number) => void>();

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
          onFailure,
        })
      ).rejects.toThrow();

      expect(onFailure).toHaveBeenCalledWith(expect.any(Error), 2);
    });

    it('should use custom shouldRetry logic', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Custom error');
      });

      const shouldRetry = vi.fn<(error: Error, attempt: number) => boolean>().mockReturnValue(false);

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.UNKNOWN_ERROR,
        severity: 'medium' as any,
        message: 'Custom error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 3,
          baseDelay: 10,
          retryableErrors: [ErrorType.UNKNOWN_ERROR],
          shouldRetry,
        })
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });
  });

  describe('Status Tracking', () => {
    it('should track active retries', () => {
      const activeRetries = retryService.getActiveRetries();
      expect(Array.isArray(activeRetries)).toBe(true);
    });

    it('should provide retry statistics', () => {
      const stats = retryService.getRetryStatistics();
      expect(stats).toHaveProperty('activeCount');
      expect(stats).toHaveProperty('operations');
      expect(typeof stats.activeCount).toBe('number');
      expect(Array.isArray(stats.operations)).toBe(true);
    });

    it('should cancel all retries', () => {
      // This should not throw
      expect(() => retryService.cancelAllRetries()).not.toThrow();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Cancelling 0 active retries')
      );
    });
  });

  describe('Error Handling', () => {
    it('should propagate callback errors', async () => {
      const operation = vi.fn<[], Promise<string>>().mockResolvedValue('success');
      const onSuccess = vi.fn<(result: string, attempts: number) => void>().mockImplementation(() => {
        throw new Error('Callback error');
      });

      // Should throw callback error
      await expect(
        retryService.executeWithRetry(
          operation,
          'Test Operation',
          { onSuccess }
        )
      ).rejects.toThrow('Callback error');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should show user notifications for retries', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      const mockSetStatusBarMessage = vscode.window.setStatusBarMessage as Mocked<any>;
      mockSetStatusBarMessage.mockImplementation(() => { });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      expect(mockSetStatusBarMessage).toHaveBeenCalledWith(
        expect.stringContaining('Retrying "Test Operation"'),
        expect.any(Number)
      );
    });

    it('should show success notification for recovered operations', async () => {
      let attemptCount = 0;
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Timeout error');
        }
        return Promise.resolve('success');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      const mockShowInformationMessage = vscode.window.showInformationMessage as Mocked<any>;
      mockShowInformationMessage.mockResolvedValue('OK');

      await retryService.executeWithRetry(operation, 'Test Operation', {
        maxAttempts: 3,
        baseDelay: 10,
        retryableErrors: [ErrorType.TIMEOUT],
      });

      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('Operation "Test Operation" succeeded after 2 attempts')
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit errors with limited retries (max 3 attempts)', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Rate limit exceeded');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.RATE_LIMITED,
        severity: 'medium' as any,
        message: 'Rate limit exceeded',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 5,
          baseDelay: 10,
          retryableErrors: [ErrorType.RATE_LIMITED],
        })
      ).rejects.toThrow();

      // Should limit rate limit retries to 2 retries max (3 total attempts: 1 initial + 2 retries)
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Logging', () => {
    it('should log retry attempts', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Executing Test Operation (attempt 1/2)')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test Operation failed on attempt 1')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Will retry Test Operation in')
      );
    });

    it('should log final failure', async () => {
      const operation = vi.fn<[], Promise<string>>().mockImplementation(() => {
        throw new Error('Timeout error');
      });

      mockErrorHandler.analyzeError.mockReturnValue({
        type: ErrorType.TIMEOUT,
        severity: 'medium' as any,
        message: 'Timeout error',
        isRetryable: true,
        troubleshootingSteps: [],
      });

      mockErrorHandler.showErrorToUser.mockResolvedValue();

      await expect(
        retryService.executeWithRetry(operation, 'Test Operation', {
          maxAttempts: 2,
          baseDelay: 10,
          retryableErrors: [ErrorType.TIMEOUT],
        })
      ).rejects.toThrow();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test Operation failed after 2 attempts')
      );
      expect(mockErrorHandler.showErrorToUser).toHaveBeenCalled();
    });
  });
});
