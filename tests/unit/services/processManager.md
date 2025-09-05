# ProcessManager Test Documentation

## Overview

The ProcessManager service handles all process execution and terminal management for Codex CLI operations. It provides both synchronous command execution and terminal-based interactive execution with comprehensive error handling and resource management.

## Test Coverage

### Command Execution
- ✅ `executeCommand()` - Executes commands and returns results
  - Handles successful command execution
  - Captures stdout and stderr output
  - Reports exit codes correctly
  - Handles command failures gracefully
  - Implements timeout protection

### Terminal Management
- ✅ `createTerminal()` - Creates and manages terminal instances
  - Creates terminals with proper configuration
  - Supports split view positioning
  - Handles hidden terminals for background execution
  - Sends commands with appropriate delays

### Process Lifecycle
- ✅ `killProcess()` - Terminates specific processes
- ✅ `killAllProcesses()` - Terminates all active processes
- ✅ `getActiveProcessCount()` - Tracks active process count
- ✅ `dispose()` - Cleanup on service disposal

### Error Handling
- ✅ Process execution errors
- ✅ Command timeout handling
- ✅ Non-existent process termination
- ✅ Resource cleanup

## Process Execution Features

### Synchronous Execution
```typescript
const result = await processManager.executeCommand('codex --version', '/workspace');
// Returns: { exitCode: 0, output: "codex version 1.0.0", error: "" }
```

### Terminal Creation
```typescript
const terminal = processManager.createTerminal('codex prompt', {
    name: 'Codex Session',
    cwd: '/workspace',
    location: { viewColumn: vscode.ViewColumn.Two }
});
```

### Shell Integration
```typescript
const result = await processManager.executeCommandWithShellIntegration(
    'codex "Generate a function"',
    '/workspace',
    30000
);
```

## Terminal Configuration

### Terminal Options
- **name**: Display name for the terminal
- **cwd**: Working directory for command execution
- **location**: VSCode panel positioning (split view support)
- **hideFromUser**: Whether terminal should be visible to user

### Location Options
- `{ viewColumn: vscode.ViewColumn.Two }` - Right panel
- `{ viewColumn: vscode.ViewColumn.One }` - Left panel
- `undefined` - Default location

## Process Management

### Active Process Tracking
The ProcessManager maintains a registry of active processes:
- Assigns unique IDs to each process
- Tracks process lifecycle
- Enables selective termination
- Provides process count monitoring

### Timeout Protection
- Default 30-second timeout for all commands
- Prevents hanging processes
- Automatic cleanup on timeout
- Configurable timeout per command

### Resource Cleanup
- Automatic process termination on timeout
- Cleanup of temporary files
- Terminal disposal management
- Memory leak prevention

## Error Handling Strategies

### Command Execution Errors
1. **Process spawn errors**: Invalid executable or permissions
2. **Runtime errors**: Command execution failures
3. **Timeout errors**: Long-running command protection
4. **Resource errors**: File system or memory issues

### Recovery Mechanisms
- Graceful error reporting with detailed messages
- Automatic resource cleanup on failures
- Fallback execution modes when shell integration unavailable
- Process termination with proper signal handling

## Security Considerations

### Command Parsing
- Safe command argument parsing
- Quoted string handling
- Special character escaping
- Shell injection prevention

### Process Isolation
- Working directory restrictions
- Process permission management
- Resource usage limits
- Signal handling for clean termination

## Performance Optimization

### Process Pooling
- Reuse of terminal instances where appropriate
- Efficient process lifecycle management
- Memory usage optimization
- Background execution for non-interactive commands

### Shell Integration
- VSCode shell integration when available
- Fallback to direct execution
- Progress tracking and completion detection
- Output capture optimization

## Integration Points

### VSCode Integration
- Terminal creation and management
- Shell integration for command tracking
- Output channel logging
- Configuration change handling

### CodexProvider Integration
- Command execution for Codex CLI
- Terminal creation for interactive sessions
- Background execution for automated tasks
- Error reporting and user feedback