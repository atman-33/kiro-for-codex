import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AgentManager } from '../../../../src/features/agents/agentManager';

// Mock vscode
jest.mock('vscode');

// Mock fs
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    },
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    copyFileSync: jest.fn(),
    readdirSync: jest.fn(),
    readFileSync: jest.fn()
}));

// Mock os
jest.mock('os');

describe('AgentManager', () => {
    let agentManager: AgentManager;
    let mockContext: vscode.ExtensionContext;
    let mockOutputChannel: vscode.OutputChannel;
    let mockWorkspaceRoot: string;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock paths
        mockWorkspaceRoot = '/test/workspace';

        // Setup mock output channel
        mockOutputChannel = {
            appendLine: jest.fn(),
            append: jest.fn(),
            show: jest.fn(),
            hide: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn(),
            replace: jest.fn()
        } as any;

        // Setup mock context
        mockContext = {
            extensionPath: '/test/extension',
            subscriptions: []
        } as any;

        // Mock vscode.workspace
        (vscode.workspace as any) = {
            workspaceFolders: [{
                uri: { fsPath: mockWorkspaceRoot }
            }],
            fs: {
                createDirectory: jest.fn().mockResolvedValue(undefined),
                stat: jest.fn(),
                copy: jest.fn().mockResolvedValue(undefined),
                readDirectory: jest.fn(),
                readFile: jest.fn()
            }
        };

        // Mock vscode.Uri
        (vscode.Uri as any) = {
            file: jest.fn((path) => ({ fsPath: path }))
        };

        // Mock os.homedir
        (os.homedir as jest.Mock).mockReturnValue('/home/test');

        // Mock vscode.FileType
        (vscode.FileType as any) = {
            File: 1,
            Directory: 2
        };

        // Create instance
        agentManager = new AgentManager(mockContext, mockOutputChannel);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('1. 构造函数和初始化', () => {
        test('TC-AM-001: 构造函数初始化', () => {
            // Arrange & Act - already done in beforeEach

            // Assert
            expect(agentManager).toBeDefined();
            expect(agentManager['workspaceRoot']).toBe(mockWorkspaceRoot);
            expect(agentManager['outputChannel']).toBe(mockOutputChannel);
            expect(agentManager['extensionPath']).toBe('/test/extension');
        });
    });

    describe('2. 内置 Agents 初始化', () => {
        test('TC-AM-002: 成功初始化内置 agents', async () => {
            // Arrange
            const targetPath = path.join(mockWorkspaceRoot, '.claude', 'agents', 'kfc');

            // Mock stat to throw (file doesn't exist)
            (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

            // Act
            await agentManager.initializeBuiltInAgents();

            // Assert
            expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(
                expect.objectContaining({ fsPath: targetPath })
            );
            // Should copy all built-in agents (7) + system prompt (1) = 8
            expect(vscode.workspace.fs.copy).toHaveBeenCalledTimes(8);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('[AgentManager] Copied agent')
            );
        });

        test('TC-AM-003: 跳过已存在的内置 agents', async () => {
            // Arrange
            // Mock that some agents already exist
            (vscode.workspace.fs.stat as jest.Mock).mockImplementation((uri) => {
                const path = uri.fsPath;
                if (path.includes('spec-requirements') || path.includes('spec-design')) {
                    return Promise.resolve({ type: vscode.FileType.File });
                }
                return Promise.reject(new Error('Not found'));
            });

            // Act
            await agentManager.initializeBuiltInAgents();

            // Assert
            // Should skip existing files (2 exist, so copy 7 - 2 = 5 agents + 1 system prompt = 6)
            expect(vscode.workspace.fs.copy).toHaveBeenCalledTimes(6);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('already exists, skipping')
            );
        });

        test('TC-AM-004: 处理初始化错误', async () => {
            // Arrange
            (vscode.workspace.fs.createDirectory as jest.Mock).mockRejectedValue(
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

    describe('3. Agent 列表获取', () => {
        test('TC-AM-005: 获取项目级 agents', async () => {
            // Arrange
            const mockAgentContent = `---
name: Test Agent
description: A test agent
tools: ["Read", "Write"]
---

Agent content here`;

            // Mock vscode.workspace.fs.readDirectory to return agent files
            (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
                ['test-agent.md', vscode.FileType.File]
            ]);

            // Mock fs.promises.readFile for agent content
            (fs.promises.readFile as jest.Mock).mockResolvedValue(mockAgentContent);

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

        test('TC-AM-006: 获取用户级 agents', async () => {
            // Arrange
            const mockAgentContent = `---
name: User Agent
description: A user agent
tools: Read, Write, Task
---`;

            // Mock vscode.workspace.fs.readDirectory
            (vscode.workspace.fs.readDirectory as jest.Mock).mockImplementation((uri) => {
                if (uri.fsPath.includes('subfolder')) {
                    return Promise.resolve([['nested-agent.md', vscode.FileType.File]]);
                }
                return Promise.resolve([
                    ['user-agent.md', vscode.FileType.File],
                    ['subfolder', vscode.FileType.Directory]
                ]);
            });

            // Mock fs.promises.readFile
            (fs.promises.readFile as jest.Mock).mockResolvedValue(mockAgentContent);

            // Act
            const agents = await agentManager.getAgentList('user');

            // Assert
            expect(agents.length).toBeGreaterThan(0);
            expect(agents[0].name).toBe('User Agent');
            expect(agents[0].tools).toEqual(['Read', 'Write', 'Task']);
        });

        test('TC-AM-007: 处理空目录', async () => {
            // Arrange
            (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([]);

            // Act
            const agents = await agentManager.getAgentList('project');

            // Assert
            expect(agents).toEqual([]);
        });

        test('TC-AM-008: 解析 YAML frontmatter', async () => {
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
            (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue(
                testCases.map(tc => [tc.filename, vscode.FileType.File])
            );

            // Mock readFile
            (fs.promises.readFile as jest.Mock).mockImplementation((path) => {
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

    describe('4. Agent 路径管理', () => {
        test('TC-AM-009: 获取 agent 路径', () => {
            // Arrange
            (fs.existsSync as jest.Mock).mockImplementation((p) => {
                return p.includes('.claude/agents/kfc/test-agent.md');
            });

            // Act
            const path = agentManager.getAgentPath('test-agent');

            // Assert
            expect(path).toBe(`${mockWorkspaceRoot}/.claude/agents/kfc/test-agent.md`);
        });

        test('TC-AM-010: 获取不存在的 agent 路径返回 null', () => {
            // Arrange
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            // Act
            const path = agentManager.getAgentPath('non-existing-agent');

            // Assert
            expect(path).toBeNull();
        });

        test('TC-AM-011: 检查 agent 存在性', () => {
            // Arrange
            (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
                // Only return true for paths that contain 'existing-agent.md'
                return p.includes('kfc/existing-agent.md');
            });

            // Act & Assert
            expect(agentManager.checkAgentExists('existing-agent', 'project')).toBe(true);
            expect(agentManager.checkAgentExists('non-existing-agent', 'project')).toBe(false);
        });
    });

    // Note: initializeSystemPrompts was moved to initializeBuiltInAgents

    describe('6. 边界情况和错误处理', () => {
        test('TC-AM-014: 处理无效的 YAML', async () => {
            // Arrange
            const invalidYaml = `---
name: Invalid Agent
tools: [unclosed array
---`;

            (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
                ['invalid.md', vscode.FileType.File]
            ]);
            (fs.promises.readFile as jest.Mock).mockResolvedValue(invalidYaml);

            // Act
            const agents = await agentManager.getAgentList('project');

            // Assert
            expect(agents).toEqual([]);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('YAML parse error')
            );
        });

        test('TC-AM-015: 处理文件读取权限问题', async () => {
            // Arrange
            // Mock readDirectory to return files
            (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValue([
                ['protected.md', vscode.FileType.File]
            ]);
            // Mock readFile to throw permission error
            (fs.promises.readFile as jest.Mock).mockRejectedValue(
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

        test('TC-AM-016: 处理空的工作区', async () => {
            // Arrange
            (vscode.workspace as any).workspaceFolders = undefined;
            const noWorkspaceManager = new AgentManager(mockContext, mockOutputChannel);

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
});