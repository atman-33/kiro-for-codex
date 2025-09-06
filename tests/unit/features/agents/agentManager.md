# AgentManager Unit Test Cases

## Test File

`agentManager.test.ts`

## Test Purpose

Ensure that the AgentManager service correctly manages Claude Code agents, including built-in agent initialization, agent list retrieval, path management, file operations, and other core functionalities. This module is responsible for managing project-level and user-level agents and serves as the core manager of the agents system.

## Test Case Overview

| Case ID   | Function Description              | Test Type      |
| --------- | --------------------------------- | -------------- |
| TC-AM-001 | Constructor initialization        | Positive test  |
| TC-AM-002 | Successfully initialize built-in agents | Positive test |
| TC-AM-003 | Skip existing built-in agents    | Positive test  |
| TC-AM-004 | Handle initialization errors      | Exception test |
| TC-AM-005 | Get project-level agents          | Positive test  |
| TC-AM-006 | Get user-level agents             | Positive test  |
| TC-AM-007 | Handle empty directories          | Boundary test  |
| TC-AM-008 | Parse YAML frontmatter           | Positive test  |
| TC-AM-009 | Get project-level agent path     | Positive test  |
| TC-AM-010 | Get user-level agent path        | Positive test  |
| TC-AM-011 | Check agent existence             | Positive test  |
| TC-AM-012 | Initialize system prompts         | Positive test  |
| TC-AM-013 | Handle existing prompt files      | Positive test  |
| TC-AM-014 | Handle invalid YAML               | Exception test |
| TC-AM-015 | Handle file read permission issues | Exception test |
| TC-AM-016 | Handle empty workspace            | Boundary test  |

## Test Environment

- Test Framework: Jest
- Mocking: vscode API, file system operations
- Test Data: Mocked agent files and configurations

## Test Cases

### 1. Constructor and Initialization

#### TC-AM-001: Constructor initialization

- **Description**: Verify AgentManager initializes correctly
- **Preconditions**: Valid workspace path and output channel
- **Test Steps**:
  1. Create AgentManager instance
  2. Verify internal properties are set correctly
- **Expected Results**:
  - workspaceRoot is set correctly
  - outputChannel is set correctly

### 2. Built-in Agents Initialization

#### TC-AM-002: Successfully initialize built-in agents

- **Description**: Verify built-in agents are successfully copied from resource directory
- **Preconditions**:
  - Resource directory contains built-in agents
  - Target directory does not contain built-in agents
- **Test Steps**:
  1. Call initializeBuiltInAgents()
  2. Verify file copy operations
- **Expected Results**:
  - Create .claude/agents/kfc directory
  - Copy all built-in agent files
  - Output success logs

#### TC-AM-003: Skip existing built-in agents

- **Description**: Verify existing agents are not overwritten
- **Preconditions**: Target directory already contains some agents
- **Test Steps**:
  1. Create some agent files
  2. Call initializeBuiltInAgents()
  3. Verify file operations
- **Expected Results**:
  - Existing files are skipped
  - Only missing files are copied
  - Output appropriate logs

#### TC-AM-004: Handle initialization errors

- **Description**: Verify error handling during initialization process
- **Preconditions**: Mock file system errors
- **Test Steps**:
  1. Mock fs operations to throw errors
  2. Call initializeBuiltInAgents()
- **Expected Results**:
  - Catch and log errors
  - Do not throw exceptions

### 3. Agent List Retrieval

#### TC-AM-005: Get project-level agents

- **Description**: Verify correct retrieval of project-level agents
- **Preconditions**: Project .claude/agents directory contains agent files
- **Test Steps**:
  1. Create mock agent files
  2. Call getAgentList('project')
  3. Verify returned list
- **Expected Results**:
  - Return all project-level agents
  - Correctly parse YAML frontmatter
  - Include path information

#### TC-AM-006: Get user-level agents

- **Description**: Verify correct retrieval of user-level agents
- **Preconditions**: User directory ~/.claude/agents contains agent files
- **Test Steps**:
  1. Mock user directory agent files
  2. Call getAgentList('user')
  3. Verify returned list
- **Expected Results**:
  - Return all user-level agents
  - Recursively read subdirectories
  - Correctly parse metadata

#### TC-AM-007: Handle empty directories

- **Description**: Verify empty directories return empty list
- **Preconditions**: agents directory does not exist or is empty
- **Test Steps**:
  1. Ensure directory is empty
  2. Call getAgentList()
- **Expected Results**: Return empty array

#### TC-AM-008: Parse YAML frontmatter

- **Description**: Verify correct parsing of different YAML formats
- **Preconditions**: Prepare agent files with different formats
- **Test Steps**:
  1. Create files with various YAML formats
  2. Call readAgentsRecursively()
  3. Verify parsing results
- **Expected Results**:
  - Correctly parse name, description
  - Correctly handle tools arrays and strings
  - Handle missing fields

### 4. Agent Path Management

#### TC-AM-009: Get project-level agent path

- **Description**: Verify correct generation of project-level agent path
- **Preconditions**: Valid workspace
- **Test Steps**:
  1. Call getAgentPath('test-agent', 'project')
  2. Verify returned path
- **Expected Results**: Return {workspace}/.claude/agents/test-agent.md

#### TC-AM-010: Get user-level agent path

- **Description**: Verify correct generation of user-level agent path
- **Preconditions**: Valid user directory
- **Test Steps**:
  1. Call getAgentPath('test-agent', 'user')
  2. Verify returned path
- **Expected Results**: Return ~/.claude/agents/test-agent.md

#### TC-AM-011: Check agent existence

- **Description**: Verify checkAgentExists method
- **Preconditions**: Prepare existing and non-existing agent files
- **Test Steps**:
  1. Create test agent file
  2. Call checkAgentExists() to check existing file
  3. Call checkAgentExists() to check non-existing file
- **Expected Results**:
  - Existing file returns true
  - Non-existing file returns false

### 5. System Prompt Initialization

#### TC-AM-012: Initialize system prompts

- **Description**: Verify system prompt file copying
- **Preconditions**: Resource directory contains prompt files
- **Test Steps**:
  1. Call initializeSystemPrompts()
  2. Verify file copying
- **Expected Results**:
  - Create .claude/prompts directory
  - Copy spec-workflow-starter.md
  - Output success logs

#### TC-AM-013: Handle existing prompt files

- **Description**: Verify not overwriting existing files
- **Preconditions**: Target file already exists
- **Test Steps**:
  1. Create existing prompt file
  2. Call initializeSystemPrompts()
- **Expected Results**:
  - Skip existing files
  - Output skip logs

### 6. Boundary Cases and Error Handling

#### TC-AM-014: Handle invalid YAML

- **Description**: Verify handling of malformed YAML
- **Preconditions**: Create files with invalid YAML
- **Test Steps**:
  1. Create malformed agent files
  2. Call getAgentList()
- **Expected Results**:
  - Do not throw exceptions
  - Log error messages
  - Skip invalid files

#### TC-AM-015: Handle file read permission issues

- **Description**: Verify handling of files without read permissions
- **Preconditions**: Mock file read permission errors
- **Test Steps**:
  1. Mock fs.readFileSync to throw permission errors
  2. Call related methods
- **Expected Results**:
  - Catch errors
  - Log error information
  - Continue processing other files

#### TC-AM-016: Handle empty workspace

- **Description**: Verify behavior when no workspace is available
- **Preconditions**: workspaceRoot is undefined
- **Test Steps**:
  1. Create AgentManager without workspace
  2. Call various methods
- **Expected Results**:
  - Methods return normally
  - Do not execute project-level operations
  - User-level operations work normally
