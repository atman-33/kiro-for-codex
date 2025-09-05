# CodexProvider Test Documentation

## Overview

This test suite validates the CodexProvider class, which serves as the main interface for integrating with Codex CLI. The CodexProvider replaces the ClaudeCodeProvider and provides similar functionality but optimized for Codex CLI operations.

## Test Coverage

### Constructor and Configuration
- ✅ Initializes with default configuration values
- ✅ Loads configuration from VSCode settings
- ✅ Handles configuration changes dynamically

### Core Functionality
- ✅ `setApprovalMode()` - Updates approval mode for Codex operations
- ✅ `checkCodexAvailability()` - Verifies Codex CLI is installed and accessible
- ✅ `renameTerminal()` - Renames terminal instances
- ✅ `getCodexConfig()` - Returns configuration copy

### Configuration Management
The CodexProvider supports the following configuration options:
- `codexPath`: Path to Codex CLI executable (default: "codex")
- `defaultApprovalMode`: Default approval mode (interactive, auto-edit, full-auto)
- `defaultModel`: Default AI model to use (default: "gpt-5")
- `timeout`: Command timeout in milliseconds (default: 30000)
- `terminalDelay`: Delay before sending commands to terminal (default: 1000)

## Integration Points

### CommandBuilder Integration
The CodexProvider uses CommandBuilder to construct proper Codex CLI commands with:
- Approval mode flags
- Model selection
- Working directory specification
- Timeout configuration

### ProcessManager Integration
The CodexProvider uses ProcessManager for:
- Command execution (both synchronous and asynchronous)
- Terminal creation and management
- Process lifecycle management

## Usage Examples

```typescript
// Create CodexProvider instance
const codexProvider = new CodexProvider(context, outputChannel);

// Check if Codex is available
const isAvailable = await codexProvider.checkCodexAvailability();

// Set approval mode
codexProvider.setApprovalMode(ApprovalMode.AutoEdit);

// Execute Codex in split view
const terminal = await codexProvider.invokeCodexSplitView(
    "Create a simple TypeScript function that adds two numbers",
    "Math Function Generator"
);

// Execute Codex in headless mode
const result = await codexProvider.invokeCodexHeadless(
    "Refactor this code to use modern ES6 syntax",
    { approvalMode: ApprovalMode.FullAuto }
);
```

## Error Handling

The CodexProvider includes comprehensive error handling for:
- Codex CLI not installed or not accessible
- Command execution failures
- Configuration errors
- File system operations

## Security Considerations

- Command arguments are properly escaped to prevent injection attacks
- Temporary files are cleaned up after use
- Working directory restrictions are enforced
- Process timeouts prevent hanging operations