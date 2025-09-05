import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';

export interface ProcessResult {
    exitCode: number;
    output?: string;
    error?: string;
}

export interface TerminalOptions {
    name: string;
    cwd?: string;
    location?: vscode.TerminalLocation | { viewColumn: vscode.ViewColumn };
    hideFromUser?: boolean;
}

export class ProcessManager {
    private outputChannel: vscode.OutputChannel;
    private activeProcesses: Map<string, ChildProcess> = new Map();

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Execute a command and return the result
     */
    async executeCommand(command: string, cwd?: string): Promise<ProcessResult> {
        return new Promise((resolve, reject) => {
            this.outputChannel.appendLine(`[ProcessManager] Executing: ${command}`);
            this.outputChannel.appendLine(`[ProcessManager] Working directory: ${cwd || 'default'}`);

            const processId = `cmd_${Date.now()}`;
            let output = '';
            let error = '';

            // Split command into executable and arguments
            const parts = this.parseCommand(command);
            const executable = parts[0];
            const args = parts.slice(1);

            const childProcess = spawn(executable, args, {
                cwd: cwd,
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.activeProcesses.set(processId, childProcess);

            // Collect stdout
            childProcess.stdout?.on('data', (data) => {
                const chunk = data.toString();
                output += chunk;
                this.outputChannel.appendLine(`[ProcessManager] stdout: ${chunk.trim()}`);
            });

            // Collect stderr
            childProcess.stderr?.on('data', (data) => {
                const chunk = data.toString();
                error += chunk;
                this.outputChannel.appendLine(`[ProcessManager] stderr: ${chunk.trim()}`);
            });

            // Handle process completion
            childProcess.on('close', (code) => {
                this.activeProcesses.delete(processId);
                this.outputChannel.appendLine(`[ProcessManager] Process completed with exit code: ${code}`);
                
                resolve({
                    exitCode: code || 0,
                    output: output.trim(),
                    error: error.trim()
                });
            });

            // Handle process errors
            childProcess.on('error', (err) => {
                this.activeProcesses.delete(processId);
                this.outputChannel.appendLine(`[ProcessManager] Process error: ${err.message}`);
                reject(new Error(`Failed to execute command: ${err.message}`));
            });

            // Set timeout if needed (default 30 seconds)
            setTimeout(() => {
                if (this.activeProcesses.has(processId)) {
                    this.outputChannel.appendLine(`[ProcessManager] Process timeout, killing process`);
                    this.killProcess(processId);
                    reject(new Error('Command execution timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Create a terminal with the specified command and options
     */
    createTerminal(command: string, options: TerminalOptions): vscode.Terminal {
        this.outputChannel.appendLine(`[ProcessManager] Creating terminal: ${options.name}`);
        this.outputChannel.appendLine(`[ProcessManager] Command: ${command}`);

        const terminal = vscode.window.createTerminal({
            name: options.name,
            cwd: options.cwd,
            location: options.location,
            hideFromUser: options.hideFromUser
        });

        // Show the terminal unless it's hidden
        if (!options.hideFromUser) {
            terminal.show();
        }

        // Send the command with a delay to allow terminal initialization
        setTimeout(() => {
            terminal.sendText(command, true);
        }, 1000);

        return terminal;
    }

    /**
     * Create a hidden terminal for background execution with shell integration
     */
    async executeCommandWithShellIntegration(
        command: string, 
        cwd?: string, 
        timeout: number = 30000
    ): Promise<ProcessResult> {
        return new Promise((resolve, reject) => {
            const terminal = vscode.window.createTerminal({
                name: 'Background Execution',
                cwd,
                hideFromUser: true
            });

            let shellIntegrationChecks = 0;
            const timeoutId = setTimeout(() => {
                terminal.dispose();
                reject(new Error('Command execution timeout'));
            }, timeout);

            // Wait for shell integration to be available
            const checkShellIntegration = setInterval(() => {
                shellIntegrationChecks++;

                if (terminal.shellIntegration) {
                    clearInterval(checkShellIntegration);
                    clearTimeout(timeoutId);

                    // Execute command with shell integration
                    const execution = terminal.shellIntegration.executeCommand(command);

                    // Listen for command completion
                    const disposable = vscode.window.onDidEndTerminalShellExecution(event => {
                        if (event.terminal === terminal && event.execution === execution) {
                            disposable.dispose();
                            terminal.dispose();

                            resolve({
                                exitCode: event.exitCode || 0,
                                output: undefined, // Shell integration doesn't provide output
                                error: event.exitCode !== 0 ? `Command failed with exit code: ${event.exitCode}` : undefined
                            });
                        }
                    });
                } else if (shellIntegrationChecks > 50) { // After 5 seconds
                    // Fallback: use regular execution
                    clearInterval(checkShellIntegration);
                    clearTimeout(timeoutId);
                    terminal.dispose();
                    
                    this.outputChannel.appendLine(`[ProcessManager] Shell integration not available, using fallback`);
                    this.executeCommand(command, cwd).then(resolve).catch(reject);
                }
            }, 100);
        });
    }

    /**
     * Kill a process by ID
     */
    killProcess(processId: string): void {
        const process = this.activeProcesses.get(processId);
        if (process) {
            this.outputChannel.appendLine(`[ProcessManager] Killing process: ${processId}`);
            process.kill('SIGTERM');
            this.activeProcesses.delete(processId);
        }
    }

    /**
     * Kill all active processes
     */
    killAllProcesses(): void {
        this.outputChannel.appendLine(`[ProcessManager] Killing all active processes`);
        for (const [id, process] of this.activeProcesses) {
            process.kill('SIGTERM');
        }
        this.activeProcesses.clear();
    }

    /**
     * Get the number of active processes
     */
    getActiveProcessCount(): number {
        return this.activeProcesses.size;
    }

    /**
     * Parse command string into executable and arguments
     * This is a simple parser - for complex commands, consider using a proper shell parser
     */
    private parseCommand(command: string): string[] {
        // Simple parsing - split by spaces but respect quoted strings
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < command.length; i++) {
            const char = command[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current.trim()) {
                    parts.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            parts.push(current.trim());
        }

        return parts;
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.killAllProcesses();
    }
}