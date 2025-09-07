// NOTE: file renamed to kebab-case
import * as vscode from 'vscode';

export enum ErrorType {
  // Installation and setup errors
  CLI_NOT_INSTALLED = 'CLI_NOT_INSTALLED',
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  VERSION_INCOMPATIBLE = 'VERSION_INCOMPATIBLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Execution errors
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  PROCESS_KILLED = 'PROCESS_KILLED',

  // Authentication and authorization errors
  AUTH_FAILED = 'AUTH_FAILED',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMITED = 'RATE_LIMITED',

  // File system errors
  FILE_ACCESS_ERROR = 'FILE_ACCESS_ERROR',
  WORKSPACE_ERROR = 'WORKSPACE_ERROR',
  TEMP_FILE_ERROR = 'TEMP_FILE_ERROR',

  // Network and connectivity errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',

  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  INVALID_OPTIONS = 'INVALID_OPTIONS',

  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CodexError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error | string;
  context?: Record<string, any>;
  isRetryable: boolean;
  troubleshootingSteps: string[];
  actionButtons?: ErrorActionButton[];
}

export interface ErrorActionButton {
  label: string;
  action: () => Promise<void> | void | Thenable<any>;
  isPrimary?: boolean;
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export class CodexErrorHandler {
  private outputChannel: vscode.OutputChannel;
  private defaultRetryOptions: RetryOptions;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.defaultRetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        ErrorType.TIMEOUT,
        ErrorType.NETWORK_ERROR,
        ErrorType.CONNECTION_TIMEOUT,
        ErrorType.RATE_LIMITED,
        ErrorType.EXECUTION_FAILED // Only for certain execution failures
      ]
    };
  }

  /**
   * Analyze and classify an error from Codex CLI execution
   */
  analyzeError(error: Error | string, context?: Record<string, any>): CodexError {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.outputChannel.appendLine(`[ErrorHandler] Analyzing error: ${errorMessage}`);
    if (errorStack) {
      this.outputChannel.appendLine(`[ErrorHandler] Stack trace: ${errorStack}`);
    }

    // Check for specific error patterns (order matters - more specific first)
    if (this.isFileAccessError(errorMessage)) {
      return this.createFileAccessError(errorMessage, error, context);
    }

    if (this.isPermissionError(errorMessage)) {
      return this.createPermissionError(errorMessage, error, context);
    }

    if (this.isTimeoutError(errorMessage)) {
      return this.createTimeoutError(errorMessage, error, context);
    }

    if (this.isAuthenticationError(errorMessage)) {
      return this.createAuthenticationError(errorMessage, error, context);
    }

    if (this.isRateLimitError(errorMessage)) {
      return this.createRateLimitError(errorMessage, error, context);
    }

    if (this.isNetworkError(errorMessage)) {
      return this.createNetworkError(errorMessage, error, context);
    }

    if (this.isConfigurationError(errorMessage)) {
      return this.createConfigurationError(errorMessage, error, context);
    }

    if (this.isInstallationError(errorMessage)) {
      return this.createInstallationError(errorMessage, error, context);
    }

    // Default to unknown error
    return this.createUnknownError(errorMessage, error, context);
  }

  /**
   * Execute a function with retry logic for transient failures
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const options = { ...this.defaultRetryOptions, ...retryOptions };
    let lastError: CodexError | null = null;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        this.outputChannel.appendLine(`[ErrorHandler] Executing ${operationName} (attempt ${attempt}/${options.maxAttempts})`);

        const result = await operation();

        if (attempt > 1) {
          this.outputChannel.appendLine(`[ErrorHandler] ${operationName} succeeded on attempt ${attempt}`);
          vscode.window.showInformationMessage(`Operation succeeded after ${attempt} attempts`);
        }

        return result;
      } catch (error) {
        const codexError = this.analyzeError(error instanceof Error ? error : String(error), {
          operation: operationName,
          attempt,
          maxAttempts: options.maxAttempts
        });

        lastError = codexError;

        this.outputChannel.appendLine(`[ErrorHandler] ${operationName} failed on attempt ${attempt}: ${codexError.message}`);

        // Check if error is retryable and we have attempts left
        if (attempt < options.maxAttempts && this.isRetryableError(codexError, options.retryableErrors)) {
          const delay = Math.min(
            options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1),
            options.maxDelay
          );

          this.outputChannel.appendLine(`[ErrorHandler] Retrying ${operationName} in ${delay}ms...`);
          await this.delay(delay);
          continue;
        }

        // If we reach here, either the error is not retryable or we've exhausted attempts
        break;
      }
    }

    // All attempts failed
    if (lastError) {
      this.outputChannel.appendLine(`[ErrorHandler] ${operationName} failed after ${options.maxAttempts} attempts`);
      throw new Error(lastError.message);
    }

    throw new Error(`${operationName} failed with unknown error`);
  }

  /**
   * Show user-friendly error message with troubleshooting options
   */
  async showErrorToUser(codexError: CodexError): Promise<void> {
    this.outputChannel.appendLine(`[ErrorHandler] Showing error to user: ${codexError.type}`);

    const message = this.formatUserMessage(codexError);

    // Prepare action buttons
    const actions: string[] = [];
    const actionMap: Map<string, () => Promise<void> | void | Thenable<any>> = new Map();

    if (codexError.actionButtons) {
      codexError.actionButtons.forEach(button => {
        actions.push(button.label);
        actionMap.set(button.label, button.action);
      });
    }

    // Add default actions
    actions.push('Show Details', 'Copy Error');

    let selectedAction: string | undefined;

    switch (codexError.severity) {
      case ErrorSeverity.CRITICAL:
        selectedAction = await vscode.window.showErrorMessage(message, ...actions);
        break;
      case ErrorSeverity.HIGH:
        selectedAction = await vscode.window.showErrorMessage(message, ...actions);
        break;
      case ErrorSeverity.MEDIUM:
        selectedAction = await vscode.window.showWarningMessage(message, ...actions);
        break;
      case ErrorSeverity.LOW:
        selectedAction = await vscode.window.showInformationMessage(message, ...actions);
        break;
    }

    if (selectedAction) {
      await this.handleUserAction(selectedAction, codexError, actionMap);
    }
  }

  /**
   * Handle user action selection from error dialog
   */
  private async handleUserAction(
    action: string,
    codexError: CodexError,
    actionMap: Map<string, () => Promise<void> | void | Thenable<any>>
  ): Promise<void> {
    if (actionMap.has(action)) {
      const actionHandler = actionMap.get(action)!;
      try {
        await actionHandler();
      } catch (error) {
        this.outputChannel.appendLine(`[ErrorHandler] Action '${action}' failed: ${error}`);
        vscode.window.showErrorMessage(`Failed to execute action: ${error}`);
      }
      return;
    }

    switch (action) {
      case 'Show Details':
        await this.showErrorDetails(codexError);
        break;
      case 'Copy Error':
        await this.copyErrorToClipboard(codexError);
        break;
    }
  }

  /**
   * Show detailed error information in a new document
   */
  private async showErrorDetails(codexError: CodexError): Promise<void> {
    const details = this.formatErrorDetails(codexError);
    const doc = await vscode.workspace.openTextDocument({
      content: details,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
  }

  /**
   * Copy error information to clipboard
   */
  private async copyErrorToClipboard(codexError: CodexError): Promise<void> {
    const errorInfo = this.formatErrorForClipboard(codexError);
    await vscode.env.clipboard.writeText(errorInfo);
    vscode.window.showInformationMessage('Error information copied to clipboard');
  }

  // Error detection methods
  private isInstallationError(message: string): boolean {
    const patterns = [
      /command not found/i,
      /ENOENT/i,
      /not found in PATH/i,
      /is not installed/i,
      /executable not found/i,
      /is not recognized as an internal or external command/i, // Windows (en-US)
      /The term '.*' is not recognized/i, // PowerShell (en)
      /内部コマンドまたは外部コマンド/i, // Windows (ja-JP)
      /認識されていません/i, // Windows (ja-JP)
      /コマンドレット/i, // PowerShell jp
      /exit code\s*9009/i // cmd.exe not found
    ];
    if (patterns.some(pattern => pattern.test(message))) return true;
    // Mojibake fallback: many replacement characters around 'codex' often indicate localized not-found
    const replacementCharCount = (message.match(/�/g) || []).length;
    if (replacementCharCount >= 5 && message.toLowerCase().includes('codex')) return true;
    return false;
  }

  private isPermissionError(message: string): boolean {
    const patterns = [
      /EACCES/i,
      /permission denied/i,
      /access denied/i,
      /insufficient permissions/i,
      /not authorized/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private isTimeoutError(message: string): boolean {
    const patterns = [
      /timeout/i,
      /timed out/i,
      /execution timeout/i,
      /command execution timeout/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private isAuthenticationError(message: string): boolean {
    const patterns = [
      /authentication failed/i,
      /invalid api key/i,
      /unauthorized/i,
      /401/i,
      /403/i,
      /invalid credentials/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private isRateLimitError(message: string): boolean {
    const patterns = [
      /rate limit/i,
      /too many requests/i,
      /429/i,
      /quota exceeded/i,
      /throttled/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private isNetworkError(message: string): boolean {
    const patterns = [
      /network error/i,
      /connection failed/i,
      /ECONNREFUSED/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
      /connection timeout/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private isFileAccessError(message: string): boolean {
    const patterns = [
      /file not found/i,
      /no such file or directory.*\.txt/i, // More specific pattern for file operations
      /ENOENT.*file.*\.txt/i,
      /cannot read file/i,
      /cannot write file/i,
      /ENOENT.*open.*'/i // Pattern for file open operations
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private isConfigurationError(message: string): boolean {
    const patterns = [
      /invalid configuration/i,
      /config error/i,
      /invalid option/i,
      /unknown flag/i,
      /invalid argument/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  // Error creation methods
  private createInstallationError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.CLI_NOT_INSTALLED,
      severity: ErrorSeverity.CRITICAL,
      message: 'Codex CLI is not installed or not found in PATH',
      originalError,
      context,
      isRetryable: false,
      troubleshootingSteps: [
        'Install Codex CLI using the official installer',
        'Ensure Codex CLI is added to your system PATH',
        'Restart VS Code after installation',
        'Verify installation by running "codex --version" in terminal'
      ],
      actionButtons: [
        {
          label: 'Open Installation Guide',
          action: () => vscode.env.openExternal(vscode.Uri.parse('https://docs.codex.ai/installation')),
          isPrimary: true
        },
        {
          label: 'Check PATH',
          action: () => this.checkSystemPath()
        }
      ]
    };
  }

  private createPermissionError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.PERMISSION_DENIED,
      severity: ErrorSeverity.HIGH,
      message: 'Permission denied when trying to execute Codex CLI',
      originalError,
      context,
      isRetryable: false,
      troubleshootingSteps: [
        'Check file permissions for Codex CLI executable',
        'Run VS Code with appropriate permissions',
        'Ensure your user account has execute permissions',
        'Try running "chmod +x $(which codex)" in terminal'
      ],
      actionButtons: [
        {
          label: 'Check Permissions',
          action: () => this.checkCodexPermissions(),
          isPrimary: true
        }
      ]
    };
  }

  private createTimeoutError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      message: 'Codex CLI operation timed out',
      originalError,
      context,
      isRetryable: true,
      troubleshootingSteps: [
        'Check your internet connection',
        'Try with a simpler prompt',
        'Increase timeout in settings',
        'Check if Codex service is experiencing issues'
      ],
      actionButtons: [
        {
          label: 'Retry',
          action: () => { }, // Will be handled by retry logic
          isPrimary: true
        },
        {
          label: 'Increase Timeout',
          action: () => this.openTimeoutSettings()
        }
      ]
    };
  }

  private createAuthenticationError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.AUTH_FAILED,
      severity: ErrorSeverity.HIGH,
      message: 'Authentication failed with Codex service',
      originalError,
      context,
      isRetryable: false,
      troubleshootingSteps: [
        'Check your API key configuration',
        'Verify your Codex account is active',
        'Ensure you have sufficient credits/quota',
        'Try logging out and logging back in'
      ],
      actionButtons: [
        {
          label: 'Configure API Key',
          action: () => this.openApiKeySettings(),
          isPrimary: true
        },
        {
          label: 'Check Account Status',
          action: () => vscode.env.openExternal(vscode.Uri.parse('https://codex.ai/account'))
        }
      ]
    };
  }

  private createRateLimitError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.RATE_LIMITED,
      severity: ErrorSeverity.MEDIUM,
      message: 'Rate limit exceeded for Codex API',
      originalError,
      context,
      isRetryable: true,
      troubleshootingSteps: [
        'Wait a few minutes before retrying',
        'Check your API usage limits',
        'Consider upgrading your plan if needed',
        'Reduce the frequency of requests'
      ],
      actionButtons: [
        {
          label: 'Retry Later',
          action: () => { }, // Will be handled by retry logic with delay
          isPrimary: true
        },
        {
          label: 'Check Usage',
          action: () => vscode.env.openExternal(vscode.Uri.parse('https://codex.ai/usage'))
        }
      ]
    };
  }

  private createNetworkError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'Network connection error',
      originalError,
      context,
      isRetryable: true,
      troubleshootingSteps: [
        'Check your internet connection',
        'Verify firewall settings allow Codex CLI',
        'Try using a different network',
        'Check if proxy settings are configured correctly'
      ],
      actionButtons: [
        {
          label: 'Retry',
          action: () => { }, // Will be handled by retry logic
          isPrimary: true
        },
        {
          label: 'Check Network',
          action: () => this.checkNetworkConnectivity()
        }
      ]
    };
  }

  private createFileAccessError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.FILE_ACCESS_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'File access error occurred',
      originalError,
      context,
      isRetryable: true,
      troubleshootingSteps: [
        'Check file permissions in the workspace',
        'Ensure the file path exists',
        'Verify disk space is available',
        'Close any applications that might be locking the file'
      ],
      actionButtons: [
        {
          label: 'Retry',
          action: () => { }, // Will be handled by retry logic
          isPrimary: true
        },
        {
          label: 'Check Workspace',
          action: () => this.checkWorkspacePermissions()
        }
      ]
    };
  }

  private createConfigurationError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.CONFIG_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Configuration error detected',
      originalError,
      context,
      isRetryable: false,
      troubleshootingSteps: [
        'Check Codex CLI configuration settings',
        'Verify all required options are set',
        'Reset configuration to defaults if needed',
        'Check for typos in configuration values'
      ],
      actionButtons: [
        {
          label: 'Open Settings',
          action: () => this.openCodexSettings(),
          isPrimary: true
        },
        {
          label: 'Reset Config',
          action: () => this.resetCodexConfiguration()
        }
      ]
    };
  }

  private createUnknownError(message: string, originalError: Error | string, context?: Record<string, any>): CodexError {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: `Unexpected error: ${message}`,
      originalError,
      context,
      isRetryable: true,
      troubleshootingSteps: [
        'Try the operation again',
        'Check the output channel for more details',
        'Restart VS Code if the problem persists',
        'Report the issue if it continues to occur'
      ],
      actionButtons: [
        {
          label: 'Retry',
          action: () => { }, // Will be handled by retry logic
          isPrimary: true
        },
        {
          label: 'Report Issue',
          action: () => this.reportIssue(originalError, context)
        }
      ]
    };
  }

  // Utility methods
  private isRetryableError(error: CodexError, retryableErrors: ErrorType[]): boolean {
    return error.isRetryable && retryableErrors.includes(error.type);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatUserMessage(error: CodexError): string {
    let message = error.message;

    if (error.isRetryable) {
      message += ' This operation can be retried.';
    }

    return message;
  }

  private formatErrorDetails(error: CodexError): string {
    const details = [
      '# Codex Error Details',
      '',
      `**Type:** ${error.type}`,
      `**Severity:** ${error.severity}`,
      `**Message:** ${error.message}`,
      `**Retryable:** ${error.isRetryable ? 'Yes' : 'No'}`,
      '',
      '## Troubleshooting Steps',
      ''
    ];

    error.troubleshootingSteps.forEach((step, index) => {
      details.push(`${index + 1}. ${step}`);
    });

    if (error.originalError) {
      details.push('', '## Original Error', '', '```');
      details.push(error.originalError.toString());
      details.push('```');
    }

    if (error.context) {
      details.push('', '## Context', '', '```json');
      details.push(JSON.stringify(error.context, null, 2));
      details.push('```');
    }

    return details.join('\n');
  }

  private formatErrorForClipboard(error: CodexError): string {
    const info = [
      `Codex Error: ${error.type}`,
      `Message: ${error.message}`,
      `Severity: ${error.severity}`,
      `Retryable: ${error.isRetryable}`
    ];

    if (error.originalError) {
      info.push(`Original Error: ${error.originalError}`);
    }

    return info.join('\n');
  }

  // Action handlers
  private async checkSystemPath(): Promise<void> {
    const terminal = vscode.window.createTerminal('Check PATH');
    terminal.show();
    terminal.sendText('echo $PATH | tr ":" "\\n" | grep -E "(codex|bin)"');
  }

  private async checkCodexPermissions(): Promise<void> {
    const terminal = vscode.window.createTerminal('Check Codex Permissions');
    terminal.show();
    terminal.sendText('ls -la $(which codex 2>/dev/null || echo "codex not found")');
  }

  private async openTimeoutSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'kiro.codex.timeout');
  }

  private async openApiKeySettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'kiro.codex.apiKey');
  }

  private async checkNetworkConnectivity(): Promise<void> {
    const terminal = vscode.window.createTerminal('Network Check');
    terminal.show();
    terminal.sendText('ping -c 3 api.codex.ai || curl -I https://api.codex.ai');
  }

  private async checkWorkspacePermissions(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      const terminal = vscode.window.createTerminal('Workspace Permissions');
      terminal.show();
      terminal.sendText(`ls -la "${workspaceFolder.uri.fsPath}"`);
    }
  }

  private async openCodexSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'kiro.codex');
  }

  private async resetCodexConfiguration(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      'This will reset all Codex configuration to defaults. Continue?',
      'Yes', 'No'
    );

    if (result === 'Yes') {
      const config = vscode.workspace.getConfiguration('kiro.codex');
      await config.update('path', undefined, vscode.ConfigurationTarget.Global);
      await config.update('defaultApprovalMode', undefined, vscode.ConfigurationTarget.Global);
      await config.update('timeout', undefined, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Codex configuration reset to defaults');
    }
  }

  private async reportIssue(error: Error | string, context?: Record<string, any>): Promise<void> {
    const issueBody = encodeURIComponent([
      '## Error Report',
      '',
      `**Error:** ${error}`,
      '',
      '**Context:**',
      '```json',
      JSON.stringify(context || {}, null, 2),
      '```',
      '',
      '**Steps to Reproduce:**',
      '1. ',
      '2. ',
      '3. ',
      '',
      '**Expected Behavior:**',
      '',
      '**Actual Behavior:**',
      ''
    ].join('\n'));

    const issueUrl = `https://github.com/kiro-extension/kiro/issues/new?body=${issueBody}`;
    await vscode.env.openExternal(vscode.Uri.parse(issueUrl));
  }
}
