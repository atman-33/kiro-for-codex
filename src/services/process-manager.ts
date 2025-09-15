import { type ChildProcess, spawn } from "child_process";
import * as vscode from "vscode";

export interface ProcessResult {
	exitCode: number;
	output?: string;
	error?: string;
}

export interface StreamHandlers {
	onStdout?: (chunk: string) => void;
	onStderr?: (chunk: string) => void;
	onClose?: (exitCode: number) => void;
}

export interface TerminalOptions {
	name: string;
	cwd?: string;
	location?: vscode.TerminalLocation | { viewColumn: vscode.ViewColumn };
	hideFromUser?: boolean;
	// shellPath?: string;
	// shellArgs?: string[];
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
	async executeCommand(
		command: string,
		cwd?: string,
		timeoutMs?: number,
	): Promise<ProcessResult> {
		return new Promise((resolve, reject) => {
			const processId = `cmd_${Date.now()}`;
			let output = "";
			let error = "";
			let finished = false;
			let timeoutId: NodeJS.Timeout | undefined;

			const log = (msg: string) =>
				this.outputChannel.appendLine(`[ProcessManager] ${msg}`);

			log(`Executing: ${command}`);
			log(`Working directory: ${cwd || "default"}`);

			// On Windows, force UTF-8 code page and use cmd for shell parsing
			let childProcess: ChildProcess;
			if (process.platform === "win32") {
				const prefixed = `chcp 65001>nul & ${command}`;
				childProcess = spawn("cmd.exe", ["/d", "/s", "/c", prefixed], {
					cwd,
					stdio: ["pipe", "pipe", "pipe"],
				});
			} else {
				// Use shell for consistent parsing across platforms
				childProcess = spawn(command, {
					cwd,
					shell: true,
					stdio: ["pipe", "pipe", "pipe"],
				});
			}

			this.activeProcesses.set(processId, childProcess);

			childProcess.stdout?.on("data", (data) => {
				const chunk = data.toString();
				output += chunk;
				log(`stdout: ${chunk.trim()}`);
			});

			childProcess.stderr?.on("data", (data) => {
				const chunk = data.toString();
				error += chunk;
				log(`stderr: ${chunk.trim()}`);
			});

			const finalize = (ok: boolean, code: number, errMsg?: string) => {
				if (finished) return;
				finished = true;
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = undefined;
				}
				this.activeProcesses.delete(processId);
				log(`Process completed with exit code: ${code}`);
				if (ok) {
					resolve({
						exitCode: code === 0 ? 0 : (code ?? -1),
						output: output.trim(),
						error: error.trim(),
					});
				} else {
					reject(new Error(errMsg ?? "Process failed"));
				}
			};

			childProcess.on("close", (code) => {
				finalize(true, code ?? -1);
			});

			childProcess.on("error", (err) => {
				log(`Process error: ${err.message}`);
				finalize(false, -1, `Failed to execute command: ${err.message}`);
			});

			if (typeof timeoutMs === "number" && timeoutMs > 0) {
				timeoutId = setTimeout(() => {
					if (finished) return;
					if (this.activeProcesses.has(processId)) {
						log(`Process timeout (${timeoutMs}ms), killing process`);
						this.killProcess(processId);
					}
					finalize(false, -1, "Command execution timeout");
				}, timeoutMs);
			}
		});
	}

	/**
	 * Execute a command with explicit executable/args (no shell), optional stdin input
	 */
	async executeCommandArgs(
		executable: string,
		args: string[],
		options?: { cwd?: string; timeoutMs?: number; input?: string },
	): Promise<ProcessResult> {
		return new Promise((resolve, reject) => {
			const processId = `cmd_${Date.now()}`;
			let output = "";
			let error = "";
			let finished = false;
			let timeoutId: NodeJS.Timeout | undefined;

			const log = (msg: string) =>
				this.outputChannel.appendLine(`[ProcessManager] ${msg}`);

			log(`Executing: ${executable} ${args.join(" ")}`);
			log(`Working directory: ${options?.cwd || "default"}`);

			const childProcess = spawn(executable, args, {
				cwd: options?.cwd,
				shell: false,
				stdio: ["pipe", "pipe", "pipe"],
			});

			this.activeProcesses.set(processId, childProcess);

			if (options?.input) {
				childProcess.stdin?.write(options.input);
				childProcess.stdin?.end();
			}

			childProcess.stdout?.on("data", (data) => {
				const chunk = data.toString();
				output += chunk;
				log(`stdout: ${chunk.trim()}`);
			});

			childProcess.stderr?.on("data", (data) => {
				const chunk = data.toString();
				error += chunk;
				log(`stderr: ${chunk.trim()}`);
			});

			const finalize = (ok: boolean, code: number, errMsg?: string) => {
				if (finished) return;
				finished = true;
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = undefined;
				}
				this.activeProcesses.delete(processId);
				log(`Process completed with exit code: ${code}`);
				if (ok) {
					resolve({
						exitCode: code === 0 ? 0 : (code ?? -1),
						output: output.trim(),
						error: error.trim(),
					});
				} else {
					reject(new Error(errMsg ?? "Process failed"));
				}
			};

			childProcess.on("close", (code) => {
				finalize(true, code ?? -1);
			});

			childProcess.on("error", (err) => {
				log(`Process error: ${err.message}`);
				finalize(false, -1, `Failed to execute command: ${err.message}`);
			});

			if (typeof options?.timeoutMs === "number" && options.timeoutMs > 0) {
				timeoutId = setTimeout(() => {
					if (finished) return;
					if (this.activeProcesses.has(processId)) {
						log(`Process timeout (${options.timeoutMs}ms), killing process`);
						this.killProcess(processId);
					}
					finalize(false, -1, "Command execution timeout");
				}, options.timeoutMs);
			}
		});
	}

	/**
	 * Execute a command (argv) and stream stdout/stderr via callbacks.
	 * Returns a controller with processId and cancel() to terminate the process.
	 */
	executeCommandArgsStream(
		executable: string,
		args: string[],
		options: { cwd?: string; input?: string } | undefined,
		handlers: StreamHandlers,
	): { processId: string; cancel: () => void } {
		this.outputChannel.appendLine(
			`[ProcessManager] (stream) Executing: ${executable} ${args.join(" ")}`,
		);
		this.outputChannel.appendLine(
			`[ProcessManager] (stream) Working directory: ${options?.cwd || "default"}`,
		);

		const processId = `cmd_${Date.now()}`;
		const childProcess = spawn(executable, args, {
			cwd: options?.cwd,
			shell: false,
			stdio: ["pipe", "pipe", "pipe"],
		});

		this.activeProcesses.set(processId, childProcess);

		if (options?.input) {
			childProcess.stdin?.write(options.input);
			childProcess.stdin?.end();
		}

		childProcess.stdout?.on("data", (data) => {
			const chunk = data.toString();
			handlers.onStdout?.(chunk);
		});

		childProcess.stderr?.on("data", (data) => {
			const chunk = data.toString();
			handlers.onStderr?.(chunk);
		});

		childProcess.on("close", (code) => {
			this.activeProcesses.delete(processId);
			this.outputChannel.appendLine(
				`[ProcessManager] (stream) Process completed with exit code: ${code}`,
			);
			handlers.onClose?.(code ?? -1);
		});

		childProcess.on("error", (err) => {
			this.activeProcesses.delete(processId);
			this.outputChannel.appendLine(
				`[ProcessManager] (stream) Process error: ${err.message}`,
			);
			handlers.onStderr?.(err.message);
			handlers.onClose?.(-1);
		});

		return {
			processId,
			cancel: () => this.killProcess(processId),
		};
	}

	/**
	 * Create a terminal with the specified command and options
	 */
	createTerminal(command: string, options: TerminalOptions): vscode.Terminal {
		this.outputChannel.appendLine(
			`[ProcessManager] Creating terminal: ${options.name}`,
		);
		this.outputChannel.appendLine(`[ProcessManager] Command: ${command}`);

		const terminal = vscode.window.createTerminal({
			name: options.name,
			cwd: options.cwd,
			location: options.location,
			hideFromUser: options.hideFromUser,
			shellPath: (options as any).shellPath,
			shellArgs: (options as any).shellArgs,
		} as any);

		if (!options.hideFromUser) {
			terminal.show();
		}

		setTimeout(() => {
			terminal.sendText(command, true);
		}, 300);

		return terminal;
	}

	/**
	 * Create a hidden terminal for background execution with shell integration
	 */
	async executeCommandWithShellIntegration(
		command: string,
		cwd?: string,
		timeout: number = 30000,
	): Promise<ProcessResult> {
		return new Promise((resolve, reject) => {
			const terminal = vscode.window.createTerminal({
				name: "Background Execution",
				cwd,
				hideFromUser: true,
			});

			let checks = 0;
			const timeoutId = setTimeout(() => {
				terminal.dispose();
				reject(new Error("Command execution timeout"));
			}, timeout);

			const tryShell = setInterval(() => {
				checks++;

				const si = (terminal as any).shellIntegration;
				if (si && typeof si.executeCommand === "function") {
					clearInterval(tryShell);
					clearTimeout(timeoutId);

					const execution = si.executeCommand(command);

					const disposable = (
						vscode.window as any
					).onDidEndTerminalShellExecution?.((event: any) => {
						if (event.terminal === terminal && event.execution === execution) {
							disposable?.dispose?.();
							terminal.dispose();

							resolve({
								exitCode: event.exitCode ?? 0,
								output: undefined, // Shell integration doesn’t provide output
								error:
									event.exitCode && event.exitCode !== 0
										? `Command failed with exit code: ${event.exitCode}`
										: undefined,
							});
						}
					});

					setTimeout(
						() => {
							disposable?.dispose?.();
							terminal.dispose();
							resolve({ exitCode: 0 });
						},
						Math.max(1000, timeout - 2000),
					);
				} else if (checks > 50) {
					clearInterval(tryShell);
					clearTimeout(timeoutId);
					terminal.dispose();

					this.outputChannel.appendLine(
						`[ProcessManager] Shell integration not available, using fallback`,
					);
					this.executeCommand(command, cwd).then(resolve).catch(reject);
				}
			}, 100);
		});
	}

	/**
	 * Kill a process by ID
	 */
	killProcess(processId: string): void {
		const proc = this.activeProcesses.get(processId);
		if (proc) {
			this.outputChannel.appendLine(
				`[ProcessManager] Killing process: ${processId}`,
			);
			try {
				proc.kill("SIGTERM");
			} catch (e: any) {
				this.outputChannel.appendLine(
					`[ProcessManager] Kill error: ${e?.message ?? String(e)}`,
				);
			}
			this.activeProcesses.delete(processId);
		}
	}

	/**
	 * Kill all active processes
	 */
	killAllProcesses(): void {
		this.outputChannel.appendLine(
			`[ProcessManager] Killing all active processes`,
		);
		for (const [id, proc] of this.activeProcesses.entries()) {
			try {
				proc.kill("SIGTERM");
			} catch {
				// ignore
			}
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
		const parts: string[] = [];
		let current = "";
		let inQuotes = false;
		let quoteChar = "";

		for (let i = 0; i < command.length; i++) {
			const char = command[i];

			if ((char === '"' || char === "'") && !inQuotes) {
				inQuotes = true;
				quoteChar = char;
			} else if (char === quoteChar && inQuotes) {
				inQuotes = false;
				quoteChar = "";
			} else if (char === " " && !inQuotes) {
				if (current.trim()) {
					parts.push(current.trim());
					current = "";
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
