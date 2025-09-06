import * as vscode from 'vscode';
import { CodexErrorHandler, ErrorType } from '../../../src/services/errorHandler';
import { RetryService } from '../../../src/services/retryService';

// Mock vscode module
jest.mock('vscode', () => ({
  window: {
    setStatusBarMessage: jest.fn(),
    showInformationMessage: jest.fn(),
  },
}));

describe('RetryService', () => {
  let retryService: RetryService;
  let mockErrorHandler: CodexErrorHandler;
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

    mockErrorHandler = {
      analyzeError: jest.fn(),
      showErrorToUser: jest.fn(),
    } as any;

    retryService = new RetryService(mockErrorHandler, mockOutputChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetry(operation, 'test operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      (mockErrorHandler.analyzeError as jest.Mock).mockReturnValue({
        type: ErrorType.TIMEOUT,
        isRetryable: true,
        message: 'Timeout error'
      });

      const result = await retryService.executeWithRetry(operation, 'test operation', {
        maxAttempts: 2,
        baseDelay: 10,
        retryableErrors: [ErrorType.TIMEOUT]
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('installation error'));

      (mockErrorHandler.analyzeError as jest.Mock).mockReturnValue({
        type: ErrorType.CLI_NOT_INSTALLED,
        isRetryable: false,
        message: 'CLI not installed'
      });

      await expect(retryService.executeWithRetry(operation, 'test operation', {
        maxAttempts: 3,
        baseDelay: 10,
        retryableErrors: [ErrorType.TIMEOUT]
      })).rejects.toThrow('installation error');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network error'));

      (mockErrorHandler.analyzeError as jest.Mock).mockReturnValue({
        type: ErrorType.NETWORK_ERROR,
        isRetryable: true,
        message: 'Network error'
      });

      await expect(retryService.executeWithRetry(operation, 'test operation', {
        maxAttempts: 2,
        baseDelay: 10,
        retryableErrors: [ErrorType.NETWORK_ERROR]
      })).rejects.toThrow('network error');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      (mockErrorHandler.analyzeError as jest.Mock).mockReturnValue({
        type: ErrorType.TIMEOUT,
        isRetryable: true,
        message: 'Timeout error'
      });

      await retryService.executeWithRetry(operation, 'test operation', {
        maxAttempts: 2,
        baseDelay: 10,
        retryableErrors: [ErrorType.TIMEOUT],
        onRetry
      });

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should call onSuccess callback', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const onSuccess = jest.fn();

      await retryService.executeWithRetry(operation, 'test operation', {
        onSuccess
      });

      expect(onSuccess).toHaveBeenCalledWith('success', 1);
    });

    it('should call onFailure callback', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));
      const onFailure = jest.fn();

      (mockErrorHandler.analyzeError as jest.Mock).mockReturnValue({
        type: ErrorType.CLI_NOT_INSTALLED,
        isRetryable: false,
        message: 'CLI not installed'
      });

      await expect(retryService.executeWithRetry(operation, 'test operation', {
        onFailure
      })).rejects.toThrow('failure');

      expect(onFailure).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should use custom shouldRetry logic', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('custom error'));
      const shouldRetry = jest.fn().mockReturnValue(false);

      (mockErrorHandler.analyzeError as jest.Mock).mockReturnValue({
        type: ErrorType.TIMEOUT,
        isRetryable: true,
        message: 'Timeout error'
      });

      await expect(retryService.executeWithRetry(operation, 'test operation', {
        maxAttempts: 2,
        baseDelay: 10,
        shouldRetry
      })).rejects.toThrow('custom error');

      expect(operation).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should calculate exponential backoff delay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('error1'))
        .mockRejectedValueOnce(new Error('error2'))
        .mockResolvedValue('success');

      (mockErrorHandler.analyzeError as jest.Mock).mockReturnValue({
        type: ErrorType.NETWORK_ERROR,
        isRetryable: true,
        message: 'Network error'
      });

      const startTime = Date.now();

      await retryService.executeWithRetry(operation, 'test operation', {
        maxAttempts: 3,
        baseDelay: 100,
        backoffMultiplier: 2,
        retryableErrors: [ErrorType.NETWORK_ERROR]
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have waited at least 100ms + 200ms (with some tolerance for jitter)
      expect(totalTime).toBeGreaterThan(250);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('getActiveRetries', () => {
    it('should return empty array when no active retries', () => {
      const activeRetries = retryService.getActiveRetries();
      expect(activeRetries).toEqual([]);
    });
  });

  describe('getRetryStatistics', () => {
    it('should return correct statistics', () => {
      const stats = retryService.getRetryStatistics();
      expect(stats).toEqual({
        activeCount: 0,
        operations: []
      });
    });
  });

  describe('cancelAllRetries', () => {
    it('should cancel all active retries', () => {
      retryService.cancelAllRetries();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[RetryService] Cancelling 0 active retries'
      );
    });
  });
});