# CommandBuilder Test Documentation

## Overview

The CommandBuilder service is responsible for constructing proper Codex CLI commands with all necessary flags and options. It provides a secure and flexible way to build commands while preventing command injection attacks.

## Test Coverage

### Approval Mode Flags
- ✅ `buildApprovalModeFlag()` - Builds correct flags for all approval modes
  - Interactive mode: `--approval-mode interactive`
  - Auto-edit mode: `--approval-mode auto-edit`
  - Full-auto mode: `--approval-mode full-auto`
  - Unknown mode defaults to interactive

### Directory and Path Handling
- ✅ `buildWorkingDirectoryFlag()` - Constructs working directory flags
- ✅ `buildVersionCommand()` - Creates version check commands
- ✅ `buildHelpCommand()` - Creates help commands

### Complete Command Building
- ✅ `buildCommand()` - Constructs complete Codex CLI commands
  - Handles all configuration options
  - Uses default values when options not specified
  - Properly formats prompt file references
  - Includes timeout, model, and directory options

### Security Features
- ✅ `buildSecureCommand()` - Creates commands with escaped arguments
  - Prevents command injection attacks
  - Properly escapes single quotes and special characters
  - Handles paths with spaces and special characters

## Command Structure

The CommandBuilder creates commands following this pattern:

```bash
codex [--approval-mode MODE] [--model MODEL] [--timeout SECONDS] [--cwd PATH] "$(cat PROMPT_FILE)"
```

### Example Commands

**Basic command:**
```bash
codex --approval-mode interactive "$(cat "/tmp/prompt-123.md")"
```

**Full command with all options:**
```bash
codex --approval-mode auto-edit --model "gpt-5" --timeout 30 --cwd "/project/path" "$(cat "/tmp/prompt-123.md")"
```

**Secure command with escaped arguments:**
```bash
codex --approval-mode 'interactive' --model 'gpt-5' --cwd '/path/with spaces' "$(cat '/tmp/prompt-123.md')"
```

## Configuration Options

### Approval Modes
- **Interactive**: User approves each change manually
- **Auto-edit**: Automatically applies safe edits, prompts for risky ones
- **Full-auto**: Applies all changes automatically without prompts

### Model Selection
- Supports any Codex-compatible model
- Default: "gpt-5"
- Can be overridden per command

### Timeout Configuration
- Specified in milliseconds in config
- Converted to seconds for CLI
- Default: 30 seconds

### Working Directory
- Specifies where Codex should execute
- Defaults to workspace root
- Can be overridden per command

## Security Features

### Argument Escaping
The CommandBuilder includes robust argument escaping:
- Single quotes are escaped as `'\''`
- Arguments are wrapped in single quotes
- Prevents command injection attacks

### Path Handling
- Properly handles paths with spaces
- Escapes special characters
- Supports both Windows and Unix paths

## Error Prevention

- Validates approval mode values
- Ensures required parameters are present
- Provides sensible defaults for optional parameters
- Prevents malformed commands