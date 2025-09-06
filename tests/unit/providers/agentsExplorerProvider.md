# AgentsExplorerProvider Unit Test Cases

## Test File

`agentsExplorerProvider.test.ts`

## Test Purpose

Ensure that AgentsExplorerProvider correctly implements the VSCode TreeDataProvider interface, providing tree view display functionality for agents. This module is responsible for displaying user-level and project-level agents in the VSCode sidebar and providing interactive functionality.

## Test Case Overview

| Case ID    | Function Description                    | Test Type     |
| ---------- | --------------------------------------- | ------------- |
| TC-AEP-001 | Constructor initialization              | Positive test |
| TC-AEP-002 | Get root nodes (user and project groups)| Positive test |
| TC-AEP-003 | Display loading state                   | Positive test |
| TC-AEP-004 | Get agents within groups                | Positive test |
| TC-AEP-005 | Handle no workspace scenario            | Boundary test |
| TC-AEP-006 | Agent node properties                   | Positive test |
| TC-AEP-007 | Group node properties                   | Positive test |
| TC-AEP-008 | Set up project agents file watching    | Positive test |
| TC-AEP-009 | Set up user agents file watching       | Positive test |
| TC-AEP-010 | File changes trigger refresh           | Positive test |
| TC-AEP-011 | Manual refresh functionality            | Positive test |
| TC-AEP-012 | Data update during refresh             | Positive test |
| TC-AEP-013 | Handle AgentManager errors             | Exception test|
| TC-AEP-014 | Handle file watcher creation failure   | Exception test|
| TC-AEP-015 | dispose method resource cleanup        | Positive test |

## Test Environment

- Test Framework: Jest
- Mocks: vscode TreeDataProvider API, AgentManager, file watchers
- Test Data: Mock agent lists and tree nodes

## Test Cases

### 1. Constructor and Initialization

#### TC-AEP-001: Constructor initialization

- **Description**: Verify AgentsExplorerProvider initializes correctly
- **Preconditions**: Valid context, agentManager and outputChannel
- **Test Steps**:
  1. Create AgentsExplorerProvider instance
  2. Verify file watcher setup
- **Expected Results**:
  - Instance created correctly
  - File watchers set up correctly

### 2. Tree Structure Generation

#### TC-AEP-002: Get root nodes (user and project groups)

- **Description**: Verify root level displays user and project agent groups
- **Preconditions**: Has workspace folder
- **Test Steps**:
  1. Call getChildren() with no parameters
  2. Verify returned nodes
- **Expected Results**:
  - Returns two nodes: User Agents and Project Agents
  - User Agents first, Project Agents second
  - Correct icons and expansion state

#### TC-AEP-003: Display loading state

- **Description**: Verify loading animation displays during refresh
- **Preconditions**: Call refresh() method
- **Test Steps**:
  1. Call refresh()
  2. Immediately call getChildren()
  3. Wait for loading completion then call again
- **Expected Results**:
  - First call returns loading node
  - Loading node uses sync~spin icon
  - After completion returns normal nodes

#### TC-AEP-004: Get agents within groups

- **Description**: Verify getting agent list under specific group
- **Preconditions**: AgentManager returns mock agents
- **Test Steps**:
  1. Create group node
  2. Call getChildren(groupNode)
  3. Verify returned agent nodes
- **Expected Results**:
  - Returns all agents of corresponding type
  - Each agent node contains correct information
  - Uses robot icon

#### TC-AEP-005: Handle no workspace scenario

- **Description**: Verify returns empty list when no workspace
- **Preconditions**: vscode.workspace.workspaceFolders is undefined
- **Test Steps**:
  1. Mock no workspace
  2. Call getChildren()
- **Expected Results**: Returns empty array

### 3. Tree Node Properties

#### TC-AEP-006: Agent node properties

- **Description**: Verify agent node property settings
- **Preconditions**: Create agent with complete information
- **Test Steps**:
  1. Create AgentItem instance
  2. Verify all properties
- **Expected Results**:
  - Correct label and icon
  - Tooltip displays description
  - Description shows tool count
  - Contains command to open file

#### TC-AEP-007: Group node properties

- **Description**: Verify group node property settings
- **Preconditions**: Create user group and project group nodes
- **Test Steps**:
  1. Create different types of group nodes
  2. Verify properties
- **Expected Results**:
  - User Agents uses globe icon
  - Project Agents uses root-folder icon
  - Correct tooltip text

### 4. File Watching Functionality

#### TC-AEP-008: Set up project agents file watching

- **Description**: Verify project agents directory watcher setup
- **Preconditions**: Has workspace folder
- **Test Steps**:
  1. Create provider instance
  2. Verify file watcher creation
- **Expected Results**:
  - Creates .claude/agents/**/*.md watcher
  - Listens for create, change, delete events

#### TC-AEP-009: Set up user agents file watching

- **Description**: Verify user agents directory watcher setup
- **Preconditions**: User directory exists
- **Test Steps**:
  1. Create provider instance
  2. Verify user directory watcher
- **Expected Results**:
  - Creates ~/.claude/agents/**/*.md watcher
  - Handles watcher creation errors

#### TC-AEP-010: File changes trigger refresh

- **Description**: Verify file changes trigger view refresh
- **Preconditions**: File watchers are set up
- **Test Steps**:
  1. Trigger file creation event
  2. Trigger file modification event
  3. Trigger file deletion event
- **Expected Results**:
  - Each event triggers _onDidChangeTreeData
  - No loading animation displayed

### 5. Refresh Mechanism

#### TC-AEP-011: Manual refresh functionality

- **Description**: Verify manual refresh displays loading animation
- **Preconditions**: Provider is initialized
- **Test Steps**:
  1. Call refresh() method
  2. Verify loading state
  3. Verify state after completion
- **Expected Results**:
  - Sets isLoading to true
  - Triggers tree update event
  - Returns to normal after 100ms

#### TC-AEP-012: Data update during refresh

- **Description**: Verify latest data displays after refresh
- **Preconditions**: AgentManager data has been updated
- **Test Steps**:
  1. Update AgentManager return data
  2. Call refresh()
  3. Verify new data display
- **Expected Results**: Displays updated agent list

### 6. Error Handling

#### TC-AEP-013: Handle AgentManager errors

- **Description**: Verify handling of errors thrown by AgentManager
- **Preconditions**: AgentManager.getAgentList throws error
- **Test Steps**:
  1. Mock getAgentList to throw error
  2. Call getChildren()
- **Expected Results**:
  - Catches error
  - Returns empty list or error node
  - Logs error message

#### TC-AEP-014: Handle file watcher creation failure

- **Description**: Verify handling of file watcher creation failure
- **Preconditions**: createFileSystemWatcher throws error
- **Test Steps**:
  1. Mock watcher creation failure
  2. Create provider instance
- **Expected Results**:
  - Catches error
  - Logs error information
  - Provider still works normally

### 7. Resource Cleanup

#### TC-AEP-015: dispose method resource cleanup

- **Description**: Verify dispose correctly cleans up resources
- **Preconditions**: Provider created and watchers set up
- **Test Steps**:
  1. Create provider
  2. Call dispose()
  3. Verify resource cleanup
- **Expected Results**:
  - File watchers are disposed
  - No longer responds to file changes
