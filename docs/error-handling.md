# Codex Error Handling System

This document describes the comprehensive error handling system implemented for Codex CLI integration in Kiro.

## Overview

The error handling system provides:
- **Error Detection**: Automatic classification of different error types
- **Retry Logic**: Intelligent retry mechanisms for transient failures
- **User Guidance**: User-friendly error messages with troubleshooting steps
- **Recovery Actions**: Actionable buttons for error resolution

## Architecture

### Core Components

1. **CodexErrorHandler** (`src/services/errorHandler.ts`)
   - Analyzes and classifies errors
   - Provides user-friendly error messages
   - Manages troubleshooting guidance

2. **RetryService** (`src/services/retryService.ts`)
   - Implements retry logic with exponential backoff
   - Manages retry attempts and timing
   - Integrates with error classification

3. **CodexProvider Integration**
   - Uses error handling in all Codex operations
   - Provides context-aware error handling
   - Manages cleanup and recovery

## Error Types

### Installation and Setup Errors
- `CLI_NOT_INSTALLED`: Codex CLI not found in PATH
- `CLI_NOT_FOUND`: Codex executable not accessible
- `VERSION_INCOMPATIBLE`: Incompatible Codex CLI version
- `PERMISSION_DENIED`: Insufficient permissions to execute

### Execution Errors
- `EXECUTION_FAILED`: Codex CLI execution failed
- `TIMEOUT`: Operation timed out
- `PROCESS_KILLED`: Process was terminated

### Authentication Errors
- `AUTH_FAILED`: Authentication with Codex service failed
- `API_KEY_INVALID`: Invalid or expired API key
- `RATE_LIMITED`: API rate limit exceeded

### File System Errors
- `FILE_ACCESS_ERROR`: File system access issues
- `WORKSPACE_ERROR`: Workspace-related problems
- `TEMP_FILE_ERROR`: Temporary file operations failed

### Network Errors
- `NETWORK_ERROR`: Network connectivity issues
- `CONNECTION_TIMEOUT`: Connection timeout

### Configuration Errors
- `CONFIG_ERROR`: Configuration validation failed
- `INVALID_OPTIONS`: Invalid command options

## Error Severity Levels

- **CRITICAL**: System cannot function (e.g., CLI not installed)
- **HIGH**: Major functionality impacted (e.g., authentication failed)
- **MEDIUM**: Partial functionality affected (e.g., timeout)
- **LOW**: Minor issues (e.g., informational warnings)

## Retry Logic

### Retry Configuration

```typescript
interface RetryOptions {
  maxAttempts: number;        // Maximum retry attempts (default: 3)
  baseDelay: number;          // Base delay in ms (default: 1000)
  maxDelay: number;           // Maximum delay in ms (default: 10000)
  backoffMultiplier: number;  // Exponential backoff multiplier (default: 2)
  retryableErrors: ErrorType[]; // Which errors to retry
}
```

### Retryable Errors

By default, these error types are retryable:
- `TIMEOUT`
- `NETWORK_ERROR`
- `CONNECTION_TIMEOUT`
- `RATE_LIMITED`
- `EXECUTION_FAILED` (with conditions)

### Exponential Backoff

Retry delays follow exponential backoff with jitter:
```
delay = min(baseDelay * (backoffMultiplier ^ (attempt - 1)) + jitter, maxDelay)
```

## Usage Examples

### Basic Error Handling

```typescript
try {
  const result = await codexProvider.executeCodex(prompt);
  // Handle success
} catch (error) {
  // Error is automatically handled by the error handling system
  // User will see appropriate error message and troubleshooting steps
}
```

### Custom Retry Logic

```typescript
const result = await retryService.executeWithRetry(
  async () => {
    return await someCodexOperation();
  },
  'Custom Operation',
  {
    maxAttempts: 5,
    baseDelay: 2000,
    shouldRetry: (error, attempt) => {
      // Custom retry logic
      return error.message.includes('temporary');
    },
    onRetry: async (attempt, error) => {
      console.log(`Retry attempt ${attempt}: ${error.message}`);
    }
  }
);
```

### Error Analysis

```typescript
const codexError = errorHandler.analyzeError(error, {
  operation: 'spec-creation',
  context: 'user-initiated'
});

// codexError contains:
// - type: ErrorType
// - severity: ErrorSeverity
// - message: string
// - troubleshootingSteps: string[]
// - actionButtons: ErrorActionButton[]
// - isRetryable: boolean
```

## Error Messages and User Experience

### Error Dialog Structure

1. **Primary Message**: Clear, non-technical description
2. **Action Buttons**: Contextual actions (e.g., "Install CLI", "Retry")
3. **Details**: Technical details available on demand
4. **Troubleshooting**: Step-by-step guidance

### Example Error Messages

#### CLI Not Installed
```
Message: "Codex CLI is not installed or not found in PATH"
Actions: [Install CLI] [Check PATH] [Show Details]
Steps:
1. Install Codex CLI using the official installer
2. Ensure Codex CLI is added to your system PATH
3. Restart VS Code after installation
4. Verify installation by running "codex --version" in terminal
```

#### Authentication Failed
```
Message: "Authentication failed with Codex service"
Actions: [Configure API Key] [Check Account] [Show Details]
Steps:
1. Check your API key configuration
2. Verify your Codex account is active
3. Ensure you have sufficient credits/quota
4. Try logging out and logging back in
```

## Monitoring and Diagnostics

### Retry Statistics

```typescript
const stats = codexProvider.getRetryStatistics();
// Returns: { activeCount: number, operations: string[] }
```

### Output Channel Logging

All error handling activities are logged to the output channel:
```
[ErrorHandler] Analyzing error: timeout
[RetryService] Executing operation (attempt 1/3)
[RetryService] Will retry operation in 1000ms
```

### Error Context

Errors include contextual information:
```typescript
{
  operation: 'codex-execution',
  attempt: 2,
  maxAttempts: 3,
  timestamp: '2024-01-01T12:00:00Z',
  workspaceFolder: '/path/to/workspace'
}
```

## Configuration

### VS Code Settings

```json
{
  "kiro.codex.timeout": 30000,
  "kiro.codex.maxRetries": 3,
  "kiro.codex.retryDelay": 1000,
  "kiro.errorHandling.showDetails": true,
  "kiro.errorHandling.autoRetry": true
}
```

### Error Handling Customization

```typescript
// Disable auto-retry for specific operations
await codexProvider.executeCodex(prompt, {
  retryOptions: { maxAttempts: 1 }
});

// Custom error handling
const errorHandler = codexProvider.getErrorHandler();
errorHandler.analyzeError(error, { customContext: 'value' });
```

## Best Practices

### For Developers

1. **Always use the error handling system** - Don't bypass it with try/catch
2. **Provide context** - Include operation details in error context
3. **Test error scenarios** - Verify error handling works correctly
4. **Monitor retry statistics** - Watch for excessive retries

### For Users

1. **Read error messages carefully** - They contain specific guidance
2. **Try suggested actions** - Action buttons provide direct solutions
3. **Check the output channel** - Contains detailed diagnostic information
4. **Report persistent issues** - Use the "Report Issue" button

## Testing

### Unit Tests

Error handling is thoroughly tested:
- Error classification accuracy
- Retry logic correctness
- User interaction handling
- Edge cases and error conditions

### Integration Tests

End-to-end testing covers:
- Real Codex CLI error scenarios
- User workflow with error recovery
- Performance under error conditions

## Troubleshooting

### Common Issues

1. **Excessive Retries**
   - Check network connectivity
   - Verify Codex service status
   - Review retry configuration

2. **Errors Not Retrying**
   - Confirm error type is retryable
   - Check custom retry logic
   - Verify error classification

3. **User Dialogs Not Showing**
   - Check VS Code focus
   - Verify error severity settings
   - Review output channel logs

### Debug Mode

Enable detailed logging:
```json
{
  "kiro.debug.errorHandling": true,
  "kiro.debug.retryService": true
}
```

This provides verbose logging of all error handling activities.