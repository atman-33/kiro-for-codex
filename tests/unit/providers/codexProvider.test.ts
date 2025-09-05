import * as vscode from 'vscode';
import { ApprovalMode, CodexProvider } from '../../../src/providers/codexProvider';

// Mock vscode
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(),
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        fs: {
            createDirectory: jest.fn(),
            writeFile: jest.fn()
        },
        onDidChangeConfiguration: jest.fn()
    },
    window: {
        createTerminal: jest.fn(),
        showErrorMessage: jest.fn()
    },
    ViewColumn: {
        Two: 2
    },
    commands: {
        executeCommand: jest.fn()
    }
}));

// Mock fs
jest.mock('fs', () => ({
    promises: {
        writeFile: jest.fn(),
        unlink: jest.fn()
    }
}));

describe('CodexProvider', () => {
    let codexProvider: CodexProvider;
    let mockContext: vscode.ExtensionContext;
    let mockOutputChannel: vscode.OutputChannel;

    beforeEach(() => {
        mockContext = {
            globalStorageUri: { fsPath: '/test/temp' }
        } as any;

        mockOutputChannel = {
            appendLine: jest.fn()
        } as any;

        // Mock configuration
        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: jest.fn((key: string, defaultValue: any) => {
                const config: any = {
                    'codex.path': 'codex',
                    'codex.defaultApprovalMode': 'interactive',
                    'codex.defaultModel': 'gpt-5',
                    'codex.timeout': 30000,
                    'codex.terminalDelay': 1000
                };
                return config[key] || defaultValue;
            })
        });

        codexProvider = new CodexProvider(mockContext, mockOutputChannel);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(codexProvider).toBeInstanceOf(CodexProvider);
            const config = codexProvider.getCodexConfig();
            expect(config.codexPath).toBe('codex');
            expect(config.defaultApprovalMode).toBe(ApprovalMode.Interactive);
            expect(config.defaultModel).toBe('gpt-5');
            expect(config.timeout).toBe(30000);
            expect(config.terminalDelay).toBe(1000);
        });
    });

    describe('setApprovalMode', () => {
        it('should update the approval mode', () => {
            codexProvider.setApprovalMode(ApprovalMode.FullAuto);
            const config = codexProvider.getCodexConfig();
            expect(config.defaultApprovalMode).toBe(ApprovalMode.FullAuto);
        });
    });

    describe('checkCodexAvailability', () => {
        it('should return true when codex is available', async () => {
            // Mock ProcessManager to return success
            const mockProcessManager = {
                executeCommand: jest.fn().mockResolvedValue({ exitCode: 0 })
            };
            (codexProvider as any).processManager = mockProcessManager;

            const result = await codexProvider.checkCodexAvailability();
            expect(result).toBe(true);
            expect(mockProcessManager.executeCommand).toHaveBeenCalledWith('codex --version');
        });

        it('should return false when codex is not available', async () => {
            // Mock ProcessManager to return failure
            const mockProcessManager = {
                executeCommand: jest.fn().mockRejectedValue(new Error('Command not found'))
            };
            (codexProvider as any).processManager = mockProcessManager;

            const result = await codexProvider.checkCodexAvailability();
            expect(result).toBe(false);
        });
    });

    describe('renameTerminal', () => {
        it('should rename terminal correctly', async () => {
            const mockTerminal = {
                show: jest.fn()
            } as any;

            await codexProvider.renameTerminal(mockTerminal, 'New Name');

            expect(mockTerminal.show).toHaveBeenCalled();
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'workbench.action.terminal.renameWithArg',
                { name: 'New Name' }
            );
        });
    });

    describe('getCodexConfig', () => {
        it('should return a copy of the configuration', () => {
            const config1 = codexProvider.getCodexConfig();
            const config2 = codexProvider.getCodexConfig();

            expect(config1).toEqual(config2);
            expect(config1).not.toBe(config2); // Should be different objects
        });
    });
});