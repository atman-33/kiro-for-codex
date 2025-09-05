# ConfigManager Unit Tests

## Overview

This test suite validates the extended ConfigManager functionality for Codex CLI integration, including configuration management, validation, and migration utilities.

## Test Coverage

### Codex Configuration Tests
- **Default Configuration**: Verifies that default Codex settings are properly initialized
- **Configuration Updates**: Tests updating partial Codex configuration while preserving existing values
- **Path Validation**: Tests Codex CLI path validation with both success and failure scenarios

### Migration Configuration Tests
- **Default Migration Settings**: Verifies default migration configuration
- **Migration Updates**: Tests updating migration configuration
- **Claude Code Migration**: Tests the complete migration process from Claude Code to Codex
- **Migration Skip Logic**: Verifies that completed migrations are properly skipped

### Approval Mode Management Tests
- **Mode Setting**: Tests setting and retrieving approval modes
- **Mode Persistence**: Verifies that approval mode changes are saved to configuration

### Codex Availability Tests
- **Availability Check**: Tests successful Codex CLI availability detection
- **Version Extraction**: Verifies proper version parsing from Codex CLI output
- **Error Handling**: Tests handling of unavailable or invalid Codex CLI installations

## Key Test Scenarios

### Configuration Validation
- Validates that Codex CLI path checking works correctly
- Tests timeout and error handling for CLI validation
- Verifies proper error message formatting

### Migration Process
- Tests backup creation during migration
- Validates preservation of existing Claude Code settings
- Tests migration completion tracking

### Error Handling
- Tests graceful handling of missing Codex CLI
- Validates error messages for various failure scenarios
- Tests timeout handling for CLI operations

## Mock Strategy

The tests use comprehensive mocking for:
- **VSCode API**: Workspace, file system operations
- **Node.js fs module**: File system operations
- **child_process**: CLI execution and process management

This ensures tests run reliably without external dependencies while validating the core logic.