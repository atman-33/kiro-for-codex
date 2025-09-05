import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import { ProcessManager } from '../../../src/services/processManager';

// Mock child_process
jest.mock('child_process');

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        createTerminal: jest.fn(),
        onDidEndTerminalShellExecution: jest.fn()
    },
    ViewColumn: {
        Two: 2
    }
}));

describe('ProcessManager', () => {
    let processManager: ProcessManager;
    let mockOutputChannel: vscode.OutputChannel;
    let mockChildProcess: any;

    beforeEach(() => {
        mockOutputChannel = {
            appendLine: jest.fn()
        } as any;

        processManager = new ProcessManager(mockOutputChannel);

        // Create a mock child process
        mockChildProcess = new EventEmitter();
        mockChildProcess.stdout = new EventEmitter();
        mockChildProcess.stderr = new EventEmitter();
        mockChildProcess.kill = jest.fn();

        (spawn as jest.Mock).mockReturnValue(mockChildProcess);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeCommand', () => {
        it('should execute command successfully', async () => {
            const commandPromise = processManager.executeCommand('echo "hello"', '/test/dir');

            // Simulate successful execution
            setTimeout(() => {
                mockChildProcess.stdout.emit('data', Buffer.from('hello\n'));
                mockChildProcess.emit('close', 0);
            }, 10);

            const result = await commandPromise;

            expect(result.exitCode).toBe(0);
            expect(result.output).toBe('hello');
            expect(spawn).toHaveBeenCalledWith('echo', ['hello'], {
                cwd: '/test/dir',
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });
        });

        it('should handle command failure', async () => {
            const commandPromise = processManager.executeCommand('invalid-command');

            // Simulate command failure
            setTimeout(() => {
                mockChildProcess.stderr.emit('data', Buffer.from('command not found\n'));
                mockChildProcess.emit('close', 1);
            }, 10);

            const result = await commandPromise;

            expect(result.exitCode).toBe(1);
            expect(result.error).toBe('command not found');
        });

        it('should handle process error', async () => {
            const commandPromise = processManager.executeCommand('test-command');

            // Simulate process error
            setTimeout(() => {
                mockChildProcess.emit('error', new Error('Process failed'));
            }, 10);

            await expect(commandPromise).rejects.toThrow('Failed to execute command: Process failed');
        });

        it('should timeout long-running commands', async () => {
            // Mock setTimeout to trigger immediately for testing
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = ((callback: Function) => {
                callback();
                return 1 as any;
            }) as any;

            const commandPromise = processManager.executeCommand('long-running-command');

            await expect(commandPromise).rejects.toThrow('Command execution timeout');

            // Restore original setTimeout
            global.setTimeout = originalSetTimeout;
        });
    });

    describe('createTerminal', () => {
        it('should create terminal with correct options', () => {
            const mockTerminal = {
                show: jest.fn(),
                sendText: jest.fn()
            };

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            const options = {
                name: 'Test Terminal',
                cwd: '/test/dir',
                location: { viewColumn: vscode.ViewColumn.Two }
            };

            const terminal = processManager.createTerminal('test command', options);

            expect(vscode.window.createTerminal).toHaveBeenCalledWith({
                name: 'Test Terminal',
                cwd: '/test/dir',
                location: { viewColumn: vscode.ViewColumn.Two },
                hideFromUser: undefined
            });

            expect(mockTerminal.show).toHaveBeenCalled();
            
            // Check that sendText is called after delay
            setTimeout(() => {
                expect(mockTerminal.sendText).toHaveBeenCalledWith('test command', true);
            }, 1100);
        });

        it('should not show hidden terminals', () => {
            const mockTerminal = {
                show: jest.fn(),
                sendText: jest.fn()
            };

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            const options = {
                name: 'Hidden Terminal',
                hideFromUser: true
            };

            processManager.createTerminal('test command', options);

            expect(mockTerminal.show).not.toHaveBeenCalled();
        });
    });

    describe('killProcess', () => {
        it('should kill active process', () => {
            // Add a mock process to the active processes
            (processManager as any).activeProcesses.set('test-id', mockChildProcess);

            processManager.killProcess('test-id');

            expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
            expect((processManager as any).activeProcesses.has('test-id')).toBe(false);
        });

        it('should handle killing non-existent process', () => {
            // Should not throw error
            expect(() => processManager.killProcess('non-existent')).not.toThrow();
        });
    });

    describe('getActiveProcessCount', () => {
        it('should return correct count of active processes', () => {
            expect(processManager.getActiveProcessCount()).toBe(0);

            (processManager as any).activeProcesses.set('test-1', mockChildProcess);
            expect(processManager.getActiveProcessCount()).toBe(1);

            (processManager as any).activeProcesses.set('test-2', mockChildProcess);
            expect(processManager.getActiveProcessCount()).toBe(2);
        });
    });

    describe('killAllProcesses', () => {
        it('should kill all active processes', () => {
            const mockProcess1 = { kill: jest.fn() };
            const mockProcess2 = { kill: jest.fn() };

            (processManager as any).activeProcesses.set('test-1', mockProcess1);
            (processManager as any).activeProcesses.set('test-2', mockProcess2);

            processManager.killAllProcesses();

            expect(mockProcess1.kill).toHaveBeenCalledWith('SIGTERM');
            expect(mockProcess2.kill).toHaveBeenCalledWith('SIGTERM');
            expect(processManager.getActiveProcessCount()).toBe(0);
        });
    });

    describe('dispose', () => {
        it('should kill all processes on dispose', () => {
            const killAllSpy = jest.spyOn(processManager, 'killAllProcesses');
            
            processManager.dispose();
            
            expect(killAllSpy).toHaveBeenCalled();
        });
    });
});