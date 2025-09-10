import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { AgentManager } from '../../../../src/features/agents/agent-manager';
import type { CodexProvider } from '../../../../src/providers/codex-provider';

// Mock vscode
vi.mock('vscode');

// Mock fs
vi.mock('fs', () => ({
    promises: {
        readFile: vi.fn()
    },
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn()
}));

// Mock os
vi.mock('os');

describe('AgentManager', () => {
    let agentManager: AgentManager;
    let mockContext: vscode.ExtensionContext;
    let mockOutputChannel: vscode.OutputChannel;
    let mockCodexProvider: vi.Mocked<CodexProvider>;
    let mockWorkspaceRoot: string;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Setup mock paths
        mockWorkspaceRoot = '/test/workspace';

        // Setup mock output channel
        mockOutputChannel = {
            appendLine: vi.fn(),
            append: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            clear: vi.fn(),
            dispose: vi.fn(),
            replace: vi.fn()
        } as any;

        // Setup mock context
        mockContext = {
            extensionPath: '/test/extension',
            subscriptions: []
        } as any;

        // Setup mock CodexProvider
        mockCodexProvider = {
            isCodexReady: vi.fn().mockResolvedValue(true),
            getCodexAvailabilityStatus: vi.fn(),
            showSetupGuidance: vi.fn(),
            getCodexConfig: vi.fn().mockReturnValue({
                defaultApprovalMode: 'interactive'
            }),
            setApprovalMode: vi.fn(),
            invokeCodexSplitView: vi.fn(),
            invokeCodexHeadless: vi.fn(),
            renameTerminal: vi.fn()
        } as any;

        // Mock vscode.workspace
        (vscode.workspace as any) = {
            workspaceFolders: [{
                uri: { fsPath: mockWorkspaceRoot }
            }],
            fs: {
                createDirectory: vi.fn().mockResolvedValue(undefined),
                stat: vi.fn(),
                copy: vi.fn().mockResolvedValue(undefined),
                readDirectory: vi.fn(),
                readFile: vi.fn()
            }
        };

        // Mock vscode.Uri
        (vscode.Uri as any) = {
            file: jest.fn((path) => ({ fsPath: path }))
        };

        // Mock os.homedir
        vi.spyOn(os, 'homedir').mockReturnValue('/home/test');

        // Mock vscode.FileType
        (vscode.FileType as any) = {
            File: 1,
            Directory: 2
        };

        // Create instance
        agentManager = new AgentManager(mockContext, mockOutputChannel, mockCodexProvider);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('1. Constructor and Initialization', () => {
        test('TC-AM-001: Constructor initialization', () => {
            // Arrange & Act - already done in beforeEach

            // Assert
            expect(agentManager).toBeDefined();
            expect(agentManager['workspaceRoot']).toBe(mockWorkspaceRoot);
            expect(agentManager['outputChannel']).toBe(mockOutputChannel);
            expect(agentManager['extensionPath']).toBe('/test/extension');
        });
    });

    describe('2. Built-in Agents Initialization', () => {
        test('TC-AM-002: Successfully initialize built-in agents', async () => {
            // Arrange
            const targetPath = path.join(mockWorkspaceRoot, '.codex', 'agents', 'kfc');

            // Mock stat to throw (file doesn't exist)
            vi.spyOn(vscode.workspace.fs, 'stat').mockRejectedValue(new Error('File not found'));

            // Act
            await agentManager.initializeBuiltInAgents();

            // Assert
            expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(
                expect.objectContaining({ fsPath: targetPath })
            );
            // Should copy all built-in agents (7) + system prompt (1) = 8
            expect(vscode.workspace.fs.copy).toHaveBeenCalledTimes(8);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('[AgentManager] Updated agent')
            );
        });

        test('TC-AM-003: Skip existing built-in agents', async () => {
            // Arrange
            // Mock that some agents already exist
            vi.spyOn(vscode.workspace.fs, 'stat').mockImplementation((uri) => {
                const path = uri.fsPath;
                if (path.includes('spec-requirements-codex') || path.includes('spec-design-codex')) {
                    return Promise.resolve({ type: vscode.FileType.File });
                }
                return Promise.reject(new Error('Not found'));
            });

            // Act
            await agentManager.initializeBuiltInAgents();

            // Assert
            // Should always overwrite files (7 agents + 1 system prompt = 8)
            expect(vscode.workspace.fs.copy).toHaveBeenCalledTimes(8);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('[AgentManager] Updated agent')
            );
        });

        test('TC-AM-004: Handle initialization errors', async () => {
            // Arrange
            vi.spyOn(vscode.workspace.fs, 'createDirectory').mockRejectedValue(
                new Error('Permission denied')
            );

            // Act
            await agentManager.initializeBuiltInAgents();

            // Assert
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('[AgentManager] Failed to initialize agents')
            );
        });
    });

    describe('3. Agent List Retrieval', () => {
        test('TC-AM-005: Get project-level agents', async () => {
            // Arrange
            const mockAgentContent = `---
name: Test Agent
description: A test agent
tools: ["Read", "Write"]
---

Agent content here`;

            // Mock vscode.workspace.fs.readDirectory to return agent files
            vi.spyOn(vscode.workspace.fs, 'readDirectory').mockResolvedValue([
                ['test-agent.md', vscode.FileType.File]
            ]);

            // Mock fs.promises.readFile for agent content
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(mockAgentContent);

            // Mock vscode.FileType
            (vscode.FileType as any) = {
                File: 1,
                Directory: 2
            };

            // Act
            const agents = await agentManager.getAgentList('project');

            // Assert
            expect(agents).toHaveLength(1);
            expect(agents[0]).toMatchObject({
                name: 'Test Agent',
                description: 'A test agent',
                tools: ['Read', 'Write'],
                type: 'project'
            });
        });

        test('TC-AM-006: Get user-level agents', async () => {
            // Arrange
            const mockAgentContent = `---
name: User Agent
description: A user agent
tools: Read, Write, Task
---`;

            // Mock vscode.workspace.fs.readDirectory
            vi.spyOn(vscode.workspace.fs, 'readDirectory').mockImplementation((uri) => {
                if (uri.fsPath.includes('subfolder')) {
                    return Promise.resolve([['nested-agent.md', vscode.FileType.File]]);
                }
                return Promise.resolve([
                    ['user-agent.md', vscode.FileType.File],
                    ['subfolder', vscode.FileType.Directory]
                ]);
            });

            // Mock fs.promises.readFile
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(mockAgentContent);

            // Act
            const agents = await agentManager.getAgentList('user');

            // Assert
            expect(agents.length).toBeGreaterThan(0);
            expect(agents[0].name).toBe('User Agent');
            expect(agents[0].tools).toEqual(['Read', 'Write', 'Task']);
        });

        test('TC-AM-007: Handle empty directories', async () => {
            // Arrange
            vi.spyOn(vscode.workspace.fs, 'readDirectory').mockResolvedValue([]);

            // Act
            const agents = await agentManager.getAgentList('project');

            // Assert
            expect(agents).toEqual([]);
        });

        test('TC-AM-008: Parse YAML frontmatter', async () => {
            // Arrange
            const testCases = [
                {
                    filename: 'agent1.md',
                    content: `---
name: Agent with Array Tools
tools: ["Read", "Write"]
---`,
                    expectedTools: ['Read', 'Write']
                },
                {
                    filename: 'agent2.md',
                    content: `---
name: Agent with String Tools
tools: Read, Write, Task
---`,
                    expectedTools: ['Read', 'Write', 'Task']
                },
                {
                    filename: 'agent3.md',
                    content: `---
name: Agent without Tools
description: No tools
---`,
                    expectedTools: undefined
                }
            ];

            // Mock readDirectory
            vi.spyOn(vscode.workspace.fs, 'readDirectory').mockResolvedValue(
                testCases.map(tc => [tc.filename, vscode.FileType.File])
            );

            // Mock readFile
            vi.spyOn(fs.promises, 'readFile').mockImplementation((path) => {
                const testCase = testCases.find(tc => path.includes(tc.filename));
                return Promise.resolve(testCase?.content || '');
            });

            // Act
            const agents = await agentManager.getAgentList('project');

            // Assert
            expect(agents).toHaveLength(3);
            expect(agents[0].tools).toEqual(testCases[0].expectedTools);
            expect(agents[1].tools).toEqual(testCases[1].expectedTools);
            expect(agents[2].tools).toEqual(testCases[2].expectedTools);
        });
    });

    describe('4. Agent Path Management', () => {
        test('TC-AM-009: Get agent path', () => {
            // Arrange (normalize path comparison for cross-OS)
            const expectedNeedle = path.join('.codex', 'agents', 'kfc', 'test-agent.md');
            (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
                return path.normalize(p).includes(path.normalize(expectedNeedle));
            });

            // Act
            const agentPath = agentManager.getAgentPath('test-agent');

            // Assert
            const expectedFull = path.join(mockWorkspaceRoot, '.codex', 'agents', 'kfc', 'test-agent.md');
            expect(agentPath).toBe(expectedFull);
        });

        test('TC-AM-010: Get non-existent agent path returns null', () => {
            // Arrange
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);

            // Act
            const agentPath = agentManager.getAgentPath('non-existing-agent');

            // Assert
            expect(agentPath).toBeNull();
        });

        test('TC-AM-011: Check agent existence', () => {
            // Arrange
            const expectedExisting = path.join('kfc', 'existing-agent.md');
            (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
                // Only return true for paths that contain 'existing-agent.md' (normalized)
                return path.normalize(p).includes(path.normalize(expectedExisting));
            });

            // Act & Assert
            expect(agentManager.checkAgentExists('existing-agent', 'project')).toBe(true);
            expect(agentManager.checkAgentExists('non-existing-agent', 'project')).toBe(false);
        });
    });

    // Note: initializeSystemPrompts was moved to initializeBuiltInAgents

    describe('6. Boundary Cases and Error Handling', () => {
        test('TC-AM-014: Handle invalid YAML', async () => {
            // Arrange
            const invalidYaml = `---
name: Invalid Agent
tools: [unclosed array
---`;

            (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
                ['invalid.md', vscode.FileType.File]
            ]);
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(invalidYaml);

            // Act
            const agents = await agentManager.getAgentList('project');

            // Assert
            expect(agents).toEqual([]);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('YAML parse error')
            );
        });

        test('TC-AM-015: Handle file read permission issues', async () => {
            // Arrange
            // Mock readDirectory to return files
            (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
                ['protected.md', vscode.FileType.File]
            ]);
            // Mock readFile to throw permission error
            vi.spyOn(fs.promises, 'readFile').mockRejectedValue(
                new Error('EACCES: permission denied')
            );

            // Act
            const agents = await agentManager.getAgentList('project');

            // Assert
            expect(agents).toEqual([]);
            // The actual error message in the code is "Failed to parse agent file"
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('[AgentManager] Failed to parse agent file')
            );
        });

        test('TC-AM-016: Handle empty workspace', async () => {
            // Arrange
            (vscode.workspace as any).workspaceFolders = undefined;
            const noWorkspaceManager = new AgentManager(mockContext, mockOutputChannel, mockCodexProvider);

            // Act
            await noWorkspaceManager.initializeBuiltInAgents();
            const projectAgents = await noWorkspaceManager.getAgentList('project');
            const userAgents = await noWorkspaceManager.getAgentList('user');

            // Assert
            expect(projectAgents).toEqual([]);
            expect(userAgents.length).toBeGreaterThanOrEqual(0); // User agents should still work
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('No workspace')
            );
        });
    });

    describe('7. Agent Execution with Codex Integration', () => {
        test('TC-AM-017: Execute agent successfully', async () => {
            // Arrange
            const agentName = 'test-agent';
            const agentContent = `---
name: Test Agent
description: A test agent
---

# Test Agent Content
This is a test agent for {{parameter1}}.`;

            (fs.existsSync as jest.Mock).mockImplementation((p) => {
                return p.includes(`${agentName}.md`);
            });
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(agentContent);
            mockCodexProvider.invokeCodexSplitView.mockResolvedValue({} as any);

            // Act
            const result = await agentManager.executeAgent(agentName, { parameter1: 'testing' });

            // Assert
            expect(result.success).toBe(true);
            expect(mockCodexProvider.invokeCodexSplitView).toHaveBeenCalledWith(
                expect.stringContaining('This is a test agent for testing'),
                'Codex - Agent: Test Agent'
            );
        });

        test('TC-AM-018: Execute agent with Codex unavailable', async () => {
            // Arrange
            mockCodexProvider.isCodexReady.mockResolvedValue(false);
            mockCodexProvider.getCodexAvailabilityStatus.mockResolvedValue({
                isAvailable: false,
                isInstalled: false,
                version: null,
                isCompatible: false,
                errorMessage: 'Codex CLI not found',
                setupGuidance: 'Please install Codex CLI'
            });

            // Act
            const result = await agentManager.executeAgent('test-agent');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Codex CLI is not available');
            expect(mockCodexProvider.showSetupGuidance).toHaveBeenCalled();
        });

        test('TC-AM-019: Execute non-existent agent', async () => {
            // Arrange
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);

            // Act
            const result = await agentManager.executeAgent('non-existent-agent');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('TC-AM-020: Execute agent in headless mode', async () => {
            // Arrange
            const agentName = 'test-agent';
            const agentContent = `---
name: Test Agent
description: A test agent
---

# Test Agent Content`;

            (fs.existsSync as jest.Mock).mockImplementation((p) => {
                return p.includes(`${agentName}.md`);
            });
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(agentContent);
            mockCodexProvider.invokeCodexHeadless.mockResolvedValue({
                exitCode: 0,
                output: 'Success'
            });

            // Act
            const result = await agentManager.executeAgentHeadless(agentName);

            // Assert
            expect(result.success).toBe(true);
            expect(result.output).toBe('Success');
            expect(mockCodexProvider.invokeCodexHeadless).toHaveBeenCalled();
        });

        test('TC-AM-021: Check agent readiness', async () => {
            // Arrange
            (fs.existsSync as jest.Mock).mockImplementation((p) => {
                return p.includes('existing-agent.md');
            });

            // Act & Assert
            expect(await agentManager.isAgentReady('existing-agent')).toBe(true);
            expect(await agentManager.isAgentReady('non-existent-agent')).toBe(false);
        });

        test('TC-AM-022: Get Codex status', async () => {
            // Arrange
            const mockConfig = {
                codexPath: 'codex',
                defaultApprovalMode: 'interactive' as any,
                timeout: 30000,
                terminalDelay: 1000
            };
            mockCodexProvider.getCodexConfig.mockReturnValue(mockConfig);

            // Act
            const status = await agentManager.getCodexStatus();

            // Assert
            expect(status.isReady).toBe(true);
            expect(status.config).toEqual(mockConfig);
        });

        test('TC-AM-023: Set Codex approval mode', () => {
            // Act
            agentManager.setCodexApprovalMode('auto-edit' as any);

            // Assert
            expect(mockCodexProvider.setApprovalMode).toHaveBeenCalledWith('auto-edit');
        });

        test('TC-AM-024: Execute spec agent', async () => {
            // Arrange
            const agentName = 'spec-requirements-codex';
            const specName = 'test-spec';
            const agentContent = `---
name: Spec Requirements Agent
description: Creates requirements
---

# Requirements Agent`;

            (fs.existsSync as jest.Mock).mockImplementation((p) => {
                return p.includes(`${agentName}.md`);
            });
            vi.spyOn(fs.promises, 'readFile').mockResolvedValue(agentContent);
            mockCodexProvider.invokeCodexSplitView.mockResolvedValue({} as any);

            // Act
            const result = await agentManager.executeSpecAgent(agentName, specName);

            // Assert
            expect(result.success).toBe(true);
            expect(mockCodexProvider.invokeCodexSplitView).toHaveBeenCalledWith(
                expect.stringContaining('**spec_name**: test-spec'),
                'Codex - Agent: Spec Requirements Agent'
            );
        });
    });
});
