import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ChildProcess } from 'child_process';
import * as vscode from 'vscode';
import { ProcessManager, TerminalOptions } from '../../../src/services/processManager';

// Mock child_process
const mockSpawn = jest.fn();
jest.mock('child_process', () => ({
    spawn: mockSpawn,
}));

describe('ProcessManager', () => {
    let processManager: ProcessManager;
    let mockOutputChannel: jest.Mocked<vscode.OutputChannel>;
    let mockChildProcess: jest.Mocked<ChildProcess>;

    beforeEach(() => {
        mockOutputChannel = {
            appendLine: jest.fn(),
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
        } as jest.Mocked<vscode.OutputChannel>;

        mockChildProcess = {
            stdout: {
                on: jest.fn(),
            },
            stderr: {
                on: jest.fn(),
            },
            on: jest.fn(),
            kill: jest.fn(),
        } as any;

        mockSpawn.mockReturnValue(mockChildProcess);

        processManager = new ProcessManager(mockOutputChannel);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeCommand', () => {
        it('should execute command successfully', async () => {
            const command = 'echo "hello world"';
            const expectedOutput = 'hello world';

            // Setup mock child process behavior
            mockChildProcess.stdout!.on = jest.fn((event, callback) => {
                if (event === 'data') {
                    setTimeout(() => callback(Buffer.from(expectedOutput)), 10);
                }
                return mockChildProcess.stdout;
            });

            mockChildProcess.stderr!.on = jest.fn((event, callback) => {
                if (event === 'data') {
                    // No error output
                }
                return mockChildProcess.stderr;
            });

            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 20);
                }
                return mockChildProcess;
            });

            const resultPromise = processManager.executeCommand(command);
            const result = await resultPromise;

            expect(result.exitCode).toBe(0);
            expect(result.output).toBe(expectedOutput);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Executing: echo "hello world"')
            );
        });

        it('should handle command execution with working directory', async () => {
            const command = 'pwd';
            const cwd = '/workspace';

            mockChildProcess.stdout!.on = jest.fn((event, callback) => {
                if (event === 'data') {
                    setTimeout(() => callback(Buffer.from('/workspace')), 10);
                }
                return mockChildProcess.stdout;
            });

            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);

            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 20);
                }
                return mockChildProcess;
            });

            await processManager.executeCommand(command, cwd);

            expect(mockSpawn).toHaveBeenCalledWith(
                'pwd',
                [],
                expect.objectContaining({
                    cwd: '/workspace',
                    shell: true,
                    stdio: ['pipe', 'pipe', 'pipe'],
                })
            );
        });

        it('should handle command execution failure', async () => {
            const command = 'invalid-command';
            const errorMessage = 'Command not found';

            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn((event, callback) => {
                if (event === 'data') {
                    setTimeout(() => callback(Buffer.from(errorMessage)), 10);
                }
                return mockChildProcess.stderr;
            });

            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(1), 20);
                }
                return mockChildProcess;
            });

            const result = await processManager.executeCommand(command);

            expect(result.exitCode).toBe(1);
            expect(result.error).toBe(errorMessage);
        });

        it('should handle process error events', async () => {
            const command = 'test-command';
            const errorMessage = 'ENOENT: no such file or directory';

            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error(errorMessage)), 10);
                }
                return mockChildProcess;
            });

            await expect(processManager.executeCommand(command)).rejects.toThrow(
                `Failed to execute command: ${errorMessage}`
            );
        });

        it('should timeout long-running commands', async () => {
            const command = 'sleep 60';

            // Mock a process that never completes
            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);
            mockChildProcess.on = jest.fn(() => mockChildProcess);

            // Mock setTimeout to trigger immediately for testing
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = jest.fn((callback) => {
                callback();
                return 1 as any;
            });

            try {
                await expect(processManager.executeCommand(command)).rejects.toThrow(
                    'Command execution timeout'
                );
            } finally {
                global.setTimeout = originalSetTimeout;
            }
        });

        it('should parse complex commands correctly', async () => {
            const command = 'codex --model "gpt-4" --approval-mode interactive "$(cat /tmp/prompt.md)"';

            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);
            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10);
                }
                return mockChildProcess;
            });

            await processManager.executeCommand(command);

            expect(mockSpawn).toHaveBeenCalledWith(
                'codex',
                expect.arrayContaining([
                    '--model',
                    '"gpt-4"',
                    '--approval-mode',
                    'interactive',
                    '"$(cat /tmp/prompt.md)"',
                ]),
                expect.any(Object)
            );
        });
    });

    describe('createTerminal', () => {
        it('should create terminal with basic options', () => {
            const command = 'npm test';
            const options: TerminalOptions = {
                name: 'Test Terminal',
                cwd: '/workspace',
            };

            const mockTerminal = {
                show: jest.fn(),
                sendText: jest.fn(),
            } as any;

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            const result = processManager.createTerminal(command, options);

            expect(vscode.window.createTerminal).toHaveBeenCalledWith({
                name: 'Test Terminal',
                cwd: '/workspace',
                location: undefined,
                hideFromUser: undefined,
            });

            expect(result).toBe(mockTerminal);
            expect(mockTerminal.show).toHaveBeenCalled();
        });

        it('should create hidden terminal', () => {
            const command = 'background-task';
            const options: TerminalOptions = {
                name: 'Background Terminal',
                hideFromUser: true,
            };

            const mockTerminal = {
                show: jest.fn(),
                sendText: jest.fn(),
            } as any;

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            processManager.createTerminal(command, options);

            expect(vscode.window.createTerminal).toHaveBeenCalledWith({
                name: 'Background Terminal',
                cwd: undefined,
                location: undefined,
                hideFromUser: true,
            });

            expect(mockTerminal.show).not.toHaveBeenCalled();
        });

        it('should send command to terminal after delay', (done) => {
            const command = 'echo "test"';
            const options: TerminalOptions = {
                name: 'Test Terminal',
            };

            const mockTerminal = {
                show: jest.fn(),
                sendText: jest.fn(),
            } as any;

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            processManager.createTerminal(command, options);

            // Check that sendText is called after delay
            setTimeout(() => {
                expect(mockTerminal.sendText).toHaveBeenCalledWith(command, true);
                done();
            }, 1100); // Slightly more than the 1000ms delay
        });

        it('should create terminal with specific location', () => {
            const command = 'codex --help';
            const options: TerminalOptions = {
                name: 'Codex Help',
                location: { viewColumn: vscode.ViewColumn.Two },
            };

            const mockTerminal = {
                show: jest.fn(),
                sendText: jest.fn(),
            } as any;

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            processManager.createTerminal(command, options);

            expect(vscode.window.createTerminal).toHaveBeenCalledWith({
                name: 'Codex Help',
                cwd: undefined,
                location: { viewColumn: vscode.ViewColumn.Two },
                hideFromUser: undefined,
            });
        });
    });

    describe('executeCommandWithShellIntegration', () => {
        it('should execute command with shell integration when available', async () => {
            const command = 'npm run build';
            const cwd = '/workspace';

            const mockExecution = { id: 'exec-1' };
            const mockTerminal = {
                shellIntegration: {
                    executeCommand: jest.fn().mockReturnValue(mockExecution),
                },
                dispose: jest.fn(),
            } as any;

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            // Mock shell execution event
            const mockEvent = {
                terminal: mockTerminal,
                execution: mockExecution,
                exitCode: 0,
            };

            (vscode.window.onDidEndTerminalShellExecution as jest.Mock).mockImplementation((callback) => {
                setTimeout(() => callback(mockEvent), 10);
                return { dispose: jest.fn() };
            });

            const result = await processManager.executeCommandWithShellIntegration(command, cwd);

            expect(result.exitCode).toBe(0);
            expect(mockTerminal.shellIntegration.executeCommand).toHaveBeenCalledWith(command);
            expect(mockTerminal.dispose).toHaveBeenCalled();
        });

        it('should fallback to regular execution when shell integration unavailable', async () => {
            const command = 'test-command';

            const mockTerminal = {
                shellIntegration: null,
                dispose: jest.fn(),
            } as any;

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            // Mock the fallback execution
            jest.spyOn(processManager, 'executeCommand').mockResolvedValue({
                exitCode: 0,
                output: 'success',
                error: '',
            });

            const result = await processManager.executeCommandWithShellIntegration(command);

            expect(result.exitCode).toBe(0);
            expect(processManager.executeCommand).toHaveBeenCalledWith(command, undefined);
        });

        it('should timeout when shell integration takes too long', async () => {
            const command = 'long-running-command';

            const mockTerminal = {
                shellIntegration: null,
                dispose: jest.fn(),
            } as any;

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            await expect(
                processManager.executeCommandWithShellIntegration(command, undefined, 100)
            ).rejects.toThrow('Command execution timeout');

            expect(mockTerminal.dispose).toHaveBeenCalled();
        });
    });

    describe('Process Management', () => {
        it('should track active processes', () => {
            expect(processManager.getActiveProcessCount()).toBe(0);

            // Start a command that doesn't complete immediately
            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);
            mockChildProcess.on = jest.fn(() => mockChildProcess);

            processManager.executeCommand('long-running-command');

            // Process count should increase (though the actual tracking is internal)
            expect(mockSpawn).toHaveBeenCalled();
        });

        it('should kill specific process by ID', () => {
            // This tests the killProcess method indirectly since process IDs are internal
            processManager.killProcess('non-existent-id');

            // Should not throw error for non-existent process
            expect(mockOutputChannel.appendLine).toHaveBeenCalled();
        });

        it('should kill all active processes', () => {
            processManager.killAllProcesses();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Killing all active processes')
            );
        });

        it('should dispose resources properly', () => {
            processManager.dispose();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Killing all active processes')
            );
        });
    });

    describe('Command Parsing', () => {
        it('should parse simple commands', async () => {
            const command = 'echo hello';

            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);
            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10);
                }
                return mockChildProcess;
            });

            await processManager.executeCommand(command);

            expect(mockSpawn).toHaveBeenCalledWith(
                'echo',
                ['hello'],
                expect.any(Object)
            );
        });

        it('should parse commands with quoted arguments', async () => {
            const command = 'echo "hello world" \'single quotes\'';

            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);
            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10);
                }
                return mockChildProcess;
            });

            await processManager.executeCommand(command);

            expect(mockSpawn).toHaveBeenCalledWith(
                'echo',
                ['"hello world"', "'single quotes'"],
                expect.any(Object)
            );
        });

        it('should handle empty commands gracefully', async () => {
            const command = '';

            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);
            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10);
                }
                return mockChildProcess;
            });

            await processManager.executeCommand(command);

            expect(mockSpawn).toHaveBeenCalledWith(
                '',
                [],
                expect.any(Object)
            );
        });

        it('should handle commands with multiple spaces', async () => {
            const command = 'echo    hello    world';

            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);
            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);
            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10);
                }
                return mockChildProcess;
            });

            await processManager.executeCommand(command);

            expect(mockSpawn).toHaveBeenCalledWith(
                'echo',
                ['hello', 'world'],
                expect.any(Object)
            );
        });
    });

    describe('Output Handling', () => {
        it('should collect and trim stdout output', async () => {
            const command = 'echo test';
            const output = '  test output  \n';

            mockChildProcess.stdout!.on = jest.fn((event, callback) => {
                if (event === 'data') {
                    setTimeout(() => callback(Buffer.from(output)), 10);
                }
                return mockChildProcess.stdout;
            });

            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);

            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 20);
                }
                return mockChildProcess;
            });

            const result = await processManager.executeCommand(command);

            expect(result.output).toBe('test output');
        });

        it('should collect and trim stderr output', async () => {
            const command = 'invalid-command';
            const errorOutput = '  error message  \n';

            mockChildProcess.stdout!.on = jest.fn(() => mockChildProcess.stdout);

            mockChildProcess.stderr!.on = jest.fn((event, callback) => {
                if (event === 'data') {
                    setTimeout(() => callback(Buffer.from(errorOutput)), 10);
                }
                return mockChildProcess.stderr;
            });

            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(1), 20);
                }
                return mockChildProcess;
            });

            const result = await processManager.executeCommand(command);

            expect(result.error).toBe('error message');
        });

        it('should log output to output channel', async () => {
            const command = 'echo test';
            const output = 'test output';

            mockChildProcess.stdout!.on = jest.fn((event, callback) => {
                if (event === 'data') {
                    setTimeout(() => callback(Buffer.from(output)), 10);
                }
                return mockChildProcess.stdout;
            });

            mockChildProcess.stderr!.on = jest.fn(() => mockChildProcess.stderr);

            mockChildProcess.on = jest.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 20);
                }
                return mockChildProcess;
            });

            await processManager.executeCommand(command);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('stdout: test output')
            );
        });
    });
});