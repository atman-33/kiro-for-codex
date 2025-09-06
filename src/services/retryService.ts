import * as vscode from 'vscode';
import { CodexErrorHandler, ErrorType, RetryOptions } from './errorHandler';

export interface RetryContext {
  operationName: string;
  startTime: number;
  attempts: number;
  lastError?: Error;
  metadata?: Record<string, any>;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryService {
  private errorHandler: CodexErrorHandler;
  private outputChannel: vscode.OutputChannel;
  private activeRetries: Map<string, RetryContext> = new Map();

  constructor(errorHandler: CodexErrorHandler, outputChannel: vscode.OutputChannel) {
    this.errorHandler = errorHandler;
    this.outputChannel = outputChannel;
  }

  /**
   * Execute an operation with comprehensive retry logic and error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions & {
      onRetry?: (attempt: number, error: Error) => Promise<void> | void;
      onSuccess?: (result: T, attempts: number) => Promise<void> | void;
      onFailure?: (error: Error, attempts: number) => Promise<void> | void;
      shouldRetry?: (error: Error, attempt: number) => boolean;
    }>
  ): Promise<T> {
    const retryId = `${operationName}_${Date.now()}`;
    const context: RetryContext = {
      operationName,
      startTime: Date.now(),
      attempts: 0,
      metadata: (options as any)?.metadata
    };

    this.activeRetries.set(retryId, context);

    try {
      const result = await this.performRetryLoop(operation, context, options);

      // Call success callback if provided
      if (options?.onSuccess) {
        await options.onSuccess(result, context.attempts);
      }

      return result;
    } catch (error) {
      // Call failure callback if provided
      if (options?.onFailure && error instanceof Error) {
        await options.onFailure(error, context.attempts);
      }

      throw error;
    } finally {
      this.activeRetries.delete(retryId);
    }
  }

  /**
   * Main retry loop implementation
   */
  private async performRetryLoop<T>(
    operation: () => Promise<T>,
    context: RetryContext,
    options?: Partial<RetryOptions & {
      onRetry?: (attempt: number, error: Error) => Promise<void> | void;
      shouldRetry?: (error: Error, attempt: number) => boolean;
    }>
  ): Promise<T> {
    const retryOptions: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        ErrorType.TIMEOUT,
        ErrorType.NETWORK_ERROR,
        ErrorType.CONNECTION_TIMEOUT,
        ErrorType.RATE_LIMITED,
        ErrorType.EXECUTION_FAILED
      ],
      ...options
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      context.attempts = attempt;

      try {
        this.outputChannel.appendLine(
          `[RetryService] Executing ${context.operationName} (attempt ${attempt}/${retryOptions.maxAttempts})`
        );

        const result = await operation();

        if (attempt > 1) {
          this.outputChannel.appendLine(
            `[RetryService] ${context.operationName} succeeded on attempt ${attempt}`
          );

          // Show success notification for recovered operations
          vscode.window.showInformationMessage(
            `Operation "${context.operationName}" succeeded after ${attempt} attempts`
          );
        }

        return result;
      } catch (error) {
        const currentError = error instanceof Error ? error : new Error(String(error));
        lastError = currentError;
        context.lastError = currentError;

        this.outputChannel.appendLine(
          `[RetryService] ${context.operationName} failed on attempt ${attempt}: ${currentError.message}`
        );

        // Analyze the error to determine if it's retryable
        const codexError = this.errorHandler.analyzeError(currentError, {
          operation: context.operationName,
          attempt,
          maxAttempts: retryOptions.maxAttempts,
          ...context.metadata
        });

        // Check if we should retry
        const shouldRetry = this.shouldRetryOperation(
          codexError,
          currentError,
          attempt,
          retryOptions,
          options?.shouldRetry
        );

        if (attempt < retryOptions.maxAttempts && shouldRetry) {
          // Calculate delay with exponential backoff
          const delay = this.calculateRetryDelay(attempt, retryOptions);

          this.outputChannel.appendLine(
            `[RetryService] Will retry ${context.operationName} in ${delay}ms (error: ${codexError.type})`
          );

          // Call retry callback if provided
          if (options?.onRetry) {
            await options.onRetry(attempt, currentError);
          }

          // Show retry notification to user
          this.showRetryNotification(context.operationName, attempt, retryOptions.maxAttempts, delay);

          await this.delay(delay);
          continue;
        } else {
          // No more retries or error is not retryable
          this.outputChannel.appendLine(
            `[RetryService] Not retrying ${context.operationName}: ${attempt >= retryOptions.maxAttempts ? 'max attempts reached' : 'error not retryable'
            }`
          );
          break;
        }
      }
    }

    // All attempts failed
    if (lastError) {
      const totalTime = Date.now() - context.startTime;
      this.outputChannel.appendLine(
        `[RetryService] ${context.operationName} failed after ${context.attempts} attempts in ${totalTime}ms`
      );

      // Show comprehensive error to user
      const finalError = this.errorHandler.analyzeError(lastError, {
        operation: context.operationName,
        totalAttempts: context.attempts,
        totalTime,
        ...context.metadata
      });

      await this.errorHandler.showErrorToUser(finalError);
      throw lastError;
    }

    throw new Error(`${context.operationName} failed with unknown error`);
  }

  /**
   * Determine if an operation should be retried based on error analysis
   */
  private shouldRetryOperation(
    codexError: any,
    originalError: Error,
    attempt: number,
    retryOptions: RetryOptions,
    customShouldRetry?: (error: Error, attempt: number) => boolean
  ): boolean {
    // Use custom retry logic if provided
    if (customShouldRetry) {
      return customShouldRetry(originalError, attempt);
    }

    // Check if error type is in retryable list
    if (!retryOptions.retryableErrors.includes(codexError.type)) {
      return false;
    }

    // Check if error is marked as retryable
    if (!codexError.isRetryable) {
      return false;
    }

    // Special handling for rate limit errors - add extra delay
    if (codexError.type === ErrorType.RATE_LIMITED) {
      return attempt <= Math.min(retryOptions.maxAttempts, 2); // Limit rate limit retries
    }

    return true;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, options: RetryOptions): number {
    const exponentialDelay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;

    const totalDelay = exponentialDelay + jitter;

    return Math.min(totalDelay, options.maxDelay);
  }

  /**
   * Show retry notification to user
   */
  private showRetryNotification(
    operationName: string,
    attempt: number,
    maxAttempts: number,
    delay: number
  ): void {
    const message = `Retrying "${operationName}" (${attempt}/${maxAttempts}) in ${Math.round(delay / 1000)}s...`;

    // Show as status bar message for less intrusive notification
    vscode.window.setStatusBarMessage(message, delay);
  }

  /**
   * Utility delay function
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get information about active retry operations
   */
  getActiveRetries(): RetryContext[] {
    return Array.from(this.activeRetries.values());
  }

  /**
   * Cancel all active retry operations
   */
  cancelAllRetries(): void {
    this.outputChannel.appendLine(`[RetryService] Cancelling ${this.activeRetries.size} active retries`);
    this.activeRetries.clear();
  }

  /**
   * Get retry statistics for monitoring
   */
  getRetryStatistics(): {
    activeCount: number;
    operations: string[];
  } {
    const operations = Array.from(this.activeRetries.values()).map(ctx => ctx.operationName);

    return {
      activeCount: this.activeRetries.size,
      operations
    };
  }
}