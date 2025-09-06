# Implementation Plan

- [x] 1. Create Codex CLI integration foundation
  - Implement CodexProvider class to replace ClaudeCodeProvider
  - Create command builder for Codex CLI commands with approval modes
  - Implement process manager for CLI execution and terminal management
  - _Requirements: 1.1, 2.1_

- [x] 2. Update configuration management system
  - Extend ConfigManager to support Codex CLI settings
  - Add Codex CLI path configuration and validation
  - Implement approval mode configuration management
  - Create migration utilities for existing Claude Code settings
  - _Requirements: 2.1, 2.2, 5.1, 5.2_

- [x] 3. Implement Codex CLI availability checking
  - Create Codex CLI installation detection functionality
  - Implement version compatibility checking
  - Add setup guidance for missing Codex CLI installation
  - _Requirements: 2.3, 7.3_

- [x] 4. Create Codex-optimized prompt templates
  - Analyze existing prompt templates and optimize for Codex CLI
  - Implement Codex-specific prompt formatting
  - Create template system for different Codex approval modes
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Update SpecManager for Codex integration
  - Modify SpecManager to use CodexProvider instead of ClaudeCodeProvider
  - Update spec creation workflow for Codex CLI
  - Implement task execution using Codex CLI commands
  - _Requirements: 4.1, 4.2_

- [x] 6. Update SteeringManager for Codex integration
  - Modify SteeringManager to use CodexProvider
  - Update steering creation and refinement workflows
  - Ensure steering documents work with Codex CLI
  - _Requirements: 4.1, 4.2_

- [x] 7. Update AgentManager for Codex integration
  - Modify AgentManager to use CodexProvider
  - Update built-in agents to work with Codex CLI
  - Ensure agent communication works with Codex-based execution
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Implement comprehensive error handling
  - Create error detection for Codex CLI execution failures
  - Implement retry logic for transient failures
  - Add user-friendly error messages and troubleshooting guidance
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Update extension entry point and commands
  - Modify extension.ts to use CodexProvider instead of ClaudeCodeProvider
  - Update command registrations for Codex CLI functionality
  - Remove Claude Code specific permission management
  - _Requirements: 1.1, 2.2, 5.3_

- [ ] 10. Update package.json and extension metadata
  - Change extension name and description to reflect Codex usage
  - Update configuration properties for Codex CLI settings
  - Modify command titles and descriptions
  - _Requirements: 5.1, 5.2_

- [ ] 11. Create comprehensive test suite
  - Write unit tests for CodexProvider functionality
  - Create integration tests for Codex CLI execution
  - Implement end-to-end tests for complete workflows
  - _Requirements: 6.1, 6.2_

- [ ] 12. Implement performance monitoring
  - Add execution time tracking for Codex CLI commands
  - Implement resource usage monitoring
  - Create performance optimization based on metrics
  - _Requirements: 6.3_

- [ ] 13. Update file watchers and providers
  - Ensure all tree view providers work with Codex integration
  - Update file system watchers for Codex-related changes
  - Modify CodeLens providers for Codex task execution
  - _Requirements: 5.3_

- [ ] 14. Localize all content to English
  - Convert all Japanese comments in source code to English
  - Translate all Japanese documentation to English
  - Update all configuration descriptions and error messages to English
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 15. Clean up Claude Code dependencies
  - Remove Claude Code specific imports and references
  - Delete unused Claude Code permission management code
  - Update all documentation and comments
  - _Requirements: 5.1, 5.2_

- [ ] 16. Final integration testing and validation
  - Test complete spec workflow with Codex CLI
  - Validate steering functionality with Codex
  - Verify agent operations with Codex integration
  - Ensure all error scenarios are properly handled
  - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.3_