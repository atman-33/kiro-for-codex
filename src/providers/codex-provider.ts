import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { MIN_CODEX_CLI_VERSION, VSC_CONFIG_NAMESPACE } from "../constants";
import { CodexSetupService } from "../services/codex-setup-service";
import { CommandBuilder } from "../services/command-builder";
import { CodexErrorHandler, ErrorType } from "../services/error-handler";
import { ProcessManager } from "../services/process-manager";
import { RetryService } from "../services/retry-service";
import { ConfigManager } from "../utils/config-manager";

export enum ApprovalMode {
	Interactive = "interactive",
	AutoEdit = "auto-edit",
	FullAuto = "full-auto",
}

export interface CodexOptions {
	approvalMode?: ApprovalMode;
	workingDirectory?: string;
	timeout?: number;
	model?: string;
}

export interface CodexResult {
	exitCode: number;
	output?: string;
	error?: string;
	filesModified?: string[];
}

export interface CodexConfig {
	codexPath: string;
	defaultApprovalMode: ApprovalMode;
	defaultModel?: string;
	timeout: number;
	terminalDelay: number;
}

export interface CodexAvailabilityResult {
	isAvailable: boolean;
	isInstalled: boolean;
	version: string | null;
	isCompatible: boolean;
	errorMessage: string | null;
	setupGuidance: string | null;
}

export class CodexProvider {
	private context: vscode.ExtensionContext;
	private outputChannel: vscode.OutputChannel;
	private configManager: ConfigManager;
	private commandBuilder: CommandBuilder;
	private processManager: ProcessManager;
	private setupService: CodexSetupService;
	private codexConfig: CodexConfig;
	private errorHandler: CodexErrorHandler;
	private retryService: RetryService;

	constructor(
		context: vscode.ExtensionContext,
		outputChannel: vscode.OutputChannel,
	) {
		this.context = context;
		this.outputChannel = outputChannel;
		this.configManager = ConfigManager.getInstance();
		this.commandBuilder = new CommandBuilder();
		this.processManager = new ProcessManager(outputChannel);
		this.setupService = CodexSetupService.getInstance(outputChannel);

		// Initialize error handling services
		this.errorHandler = new CodexErrorHandler(outputChannel);
		this.retryService = new RetryService(this.errorHandler, outputChannel);

		// Initialize Codex configuration with defaults
		this.codexConfig = {
			codexPath: "codex",
			defaultApprovalMode: ApprovalMode.Interactive,
			defaultModel: "gpt-5",
			timeout: 30000,
			terminalDelay: 1000,
		};

		this.configManager.loadSettings();

		// Listen for configuration changes
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration(VSC_CONFIG_NAMESPACE)) {
				this.configManager.loadSettings();
				this.loadCodexConfig();
			}
		});

		this.loadCodexConfig();
	}

	/**
	 * Load Codex-specific configuration from workspace settings
	 */
	private loadCodexConfig(): void {
		const config = vscode.workspace.getConfiguration(VSC_CONFIG_NAMESPACE);

		this.codexConfig = {
			codexPath: config.get("codex.path", "codex"),
			defaultApprovalMode: config.get(
				"codex.defaultApprovalMode",
				ApprovalMode.Interactive,
			) as ApprovalMode,
			defaultModel: config.get("codex.defaultModel", "gpt-5"),
			timeout: config.get("codex.timeout", 30000),
			terminalDelay: config.get("codex.terminalDelay", 1000),
		};
	}

	/**
	 * Check if Codex CLI is available and properly configured
	 */
	async checkCodexAvailability(): Promise<boolean> {
		try {
			const result = await this.processManager.executeCommand(
				`${this.codexConfig.codexPath} --version`,
			);
			return result.exitCode === 0;
		} catch (error) {
			this.outputChannel.appendLine(
				`[CodexProvider] Codex CLI not available: ${error}`,
			);
			return false;
		}
	}

	/**
	 * Comprehensive Codex CLI availability and compatibility check
	 */
	async checkCodexInstallationAndCompatibility(): Promise<CodexAvailabilityResult> {
		const result: CodexAvailabilityResult = {
			isAvailable: false,
			isInstalled: false,
			version: null,
			isCompatible: false,
			errorMessage: null,
			setupGuidance: null,
		};

		try {
			// First check if Codex CLI is installed and accessible
			const versionResult = await this.processManager.executeCommand(
				this.commandBuilder.buildVersionCommand(this.codexConfig.codexPath),
			);

			if (versionResult.exitCode === 0) {
				result.isInstalled = true;

				// Parse version from output
				const versionMatch = versionResult.output?.match(/(\d+\.\d+\.\d+)/);
				if (versionMatch) {
					result.version = versionMatch[1];

					// Check version compatibility
					const isCompatible = this.checkVersionCompatibility(result.version);
					result.isCompatible = isCompatible;

					if (isCompatible) {
						result.isAvailable = true;
						this.outputChannel.appendLine(
							`[CodexProvider] Codex CLI v${result.version} is available and compatible`,
						);
					} else {
						result.errorMessage = `Codex CLI version ${result.version} is not compatible. Minimum required version is ${this.getMinimumRequiredVersion()}`;
						result.setupGuidance = this.getVersionUpgradeGuidance();
						this.outputChannel.appendLine(
							`[CodexProvider] ${result.errorMessage}`,
						);
					}
				} else {
					result.errorMessage = "Unable to parse Codex CLI version from output";
					result.setupGuidance = this.getInstallationGuidance();
					this.outputChannel.appendLine(
						`[CodexProvider] ${result.errorMessage}`,
					);
				}
			} else {
				// Detect common "command not found" scenarios (Windows, macOS, Linux, localized, or mojibake)
				const notFound = this.isCliNotFound(
					versionResult.exitCode,
					versionResult.output,
					versionResult.error,
				);
				if (notFound) {
					result.errorMessage = `Codex CLI is not installed or not found in PATH`;
					result.setupGuidance = this.getInstallationGuidance();
					this.outputChannel.appendLine(
						`[CodexProvider] ${result.errorMessage}`,
					);
				} else {
					result.errorMessage = `Codex CLI command failed with exit code ${versionResult.exitCode}`;
					if (versionResult.error) {
						result.errorMessage += `: ${versionResult.error}`;
					}
					// Generic troubleshooting guidance
					result.setupGuidance = this.getTroubleshootingGuidance();
					this.outputChannel.appendLine(
						`[CodexProvider] ${result.errorMessage}`,
					);
				}
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			if (
				errorMessage.includes("ENOENT") ||
				errorMessage.includes("command not found")
			) {
				result.errorMessage = `Codex CLI is not installed or not found in PATH`;
				result.setupGuidance = this.getInstallationGuidance();
			} else if (errorMessage.includes("EACCES")) {
				result.errorMessage = `Permission denied when trying to execute Codex CLI`;
				result.setupGuidance = this.getPermissionGuidance();
			} else {
				result.errorMessage = `Failed to check Codex CLI availability: ${errorMessage}`;
				result.setupGuidance = this.getTroubleshootingGuidance();
			}

			this.outputChannel.appendLine(`[CodexProvider] ${result.errorMessage}`);
		}

		return result;
	}

	/**
	 * Heuristics to detect "command not found" across platforms/locales and mojibake cases
	 */
	private isCliNotFound(
		exitCode: number,
		stdout?: string,
		stderr?: string,
	): boolean {
		const out = `${stdout || ""}\n${stderr || ""}`;
		const lower = out.toLowerCase();

		// Exit codes that strongly indicate command-not-found
		if (process.platform === "win32" && exitCode === 9009) return true; // cmd.exe
		if (exitCode === 127) return true; // POSIX

		// Common English/locale-specific phrases
		const patterns: RegExp[] = [
			/is not recognized as an internal or external command/i, // Windows (en-US)
			/command not found/i, // POSIX shells
			/no such file or directory/i,
			/内部コマンドまたは外部コマンド/i, // Windows (ja-JP)
			/認識されていません/i, // Windows (ja-JP)
			/コマンドレット/i, // PowerShell jp: "コマンドレット"
			/用語 .+ は、/i, // PowerShell jp: "用語 'xxx' は、..."
			/no se reconoce como un comando interno o externo/i, // es-ES
			/não é reconhecido como um comando interno ou externo/i, // pt-BR
			/ne reconnaît pas en tant que commande interne ou externe/i, // fr-FR
			/не является внутренней или внешней командой/i, // ru-RU
		];

		if (patterns.some((rx) => rx.test(out))) return true;

		// Mojibake fallback: many replacement characters often accompany localized Windows error lines
		const replacementCharCount = (out.match(/�/g) || []).length;
		if (
			process.platform === "win32" &&
			replacementCharCount >= 5 &&
			lower.includes("codex")
		) {
			return true;
		}

		return false;
	}

	/**
	 * Check if the given version is compatible with the extension
	 */
	private checkVersionCompatibility(version: string): boolean {
		const minVersion = this.getMinimumRequiredVersion();
		return this.compareVersions(version, minVersion) >= 0;
	}

	/**
	 * Get the minimum required Codex CLI version
	 */
	private getMinimumRequiredVersion(): string {
		return MIN_CODEX_CLI_VERSION;
	}

	/**
	 * Compare two semantic version strings
	 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
	 */
	private compareVersions(v1: string, v2: string): number {
		const parts1 = v1.split(".").map(Number);
		const parts2 = v2.split(".").map(Number);

		for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
			const part1 = parts1[i] || 0;
			const part2 = parts2[i] || 0;

			if (part1 < part2) return -1;
			if (part1 > part2) return 1;
		}

		return 0;
	}

	/**
	 * Get installation guidance for Codex CLI
	 */
	private getInstallationGuidance(): string {
		return this.setupService.getInstallationGuidance();
	}

	/**
	 * Get version upgrade guidance
	 */
	private getVersionUpgradeGuidance(): string {
		const minVersion = this.getMinimumRequiredVersion();
		return this.setupService.getVersionUpgradeGuidance("unknown", minVersion);
	}

	/**
	 * Get permission guidance for Codex CLI
	 */
	private getPermissionGuidance(): string {
		return this.setupService.getPermissionGuidance();
	}

	/**
	 * Get general troubleshooting guidance
	 */
	private getTroubleshootingGuidance(): string {
		return this.setupService.getTroubleshootingGuidance();
	}

	/**
	 * Show setup guidance to the user with actionable options
	 */
	async showSetupGuidance(
		availabilityResult: CodexAvailabilityResult,
	): Promise<void> {
		await this.setupService.showSetupGuidance(availabilityResult);
	}

	/**
	 * Execute Codex CLI with the given prompt and options
	 */
	async executeCodex(
		prompt: string,
		options?: CodexOptions,
	): Promise<CodexResult> {
		return await this.retryService.executeWithRetry(
			async () => {
				// Check availability first
				const availabilityResult =
					await this.checkCodexInstallationAndCompatibility();
				if (!availabilityResult.isAvailable) {
					await this.showSetupGuidance(availabilityResult);
					const error = new Error(
						availabilityResult.errorMessage || "Codex CLI is not available",
					);
					// Add error type information for proper classification
					(error as any).codexErrorType = availabilityResult.isInstalled
						? ErrorType.VERSION_INCOMPATIBLE
						: ErrorType.CLI_NOT_INSTALLED;
					throw error;
				}

				try {
					// Build argv flags (no shell) and execute with argument list
					const workingDir =
						options?.workingDirectory ||
						vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
					const timeout = options?.timeout || this.codexConfig.timeout;

					let result: any;
					const hasBuildArgs =
						typeof (this.commandBuilder as any).buildArgs === "function";
					if (hasBuildArgs) {
						const args = (this.commandBuilder as any).buildArgs({
							...this.codexConfig,
							...options,
						});

						if (process.platform === "win32") {
							// Windows: use stdin with `codex -` to pass multi-line prompt safely
							const filteredArgs: string[] = [];
							for (let i = 0; i < args.length; i++) {
								const arg = args[i];
								if (arg === "-a") {
									i++;
									continue;
								} // skip approval mode for exec
								if (arg === "--full-auto") {
									continue;
								}
								filteredArgs.push(arg);
							}
							const execArgs = ["exec", ...filteredArgs, "-"];

							result = await Promise.race([
								this.processManager.executeCommandArgs(
									this.codexConfig.codexPath,
									execArgs,
									{ cwd: workingDir, timeoutMs: timeout, input: prompt },
								),
								this.createTimeoutPromise(timeout),
							]);
						} else {
							// Non-Windows: align with Windows behavior; use stdin with `exec -`
							const filteredArgs: string[] = [];
							for (let i = 0; i < args.length; i++) {
								const arg = args[i];
								if (arg === "-a") {
									i++;
									continue;
								} // skip approval mode for exec
								if (arg === "--full-auto") {
									continue;
								}
								filteredArgs.push(arg);
							}
							const execArgs = ["exec", ...filteredArgs, "-"];

							result = await Promise.race([
								this.processManager.executeCommandArgs(
									this.codexConfig.codexPath,
									execArgs,
									{ cwd: workingDir, timeoutMs: timeout, input: prompt },
								),
								this.createTimeoutPromise(timeout),
							]);
						}
					} else {
						// Fallback to legacy behavior (temp file + string command)
						const promptFilePath = await this.createTempFile(
							prompt,
							"codex-prompt",
						);
						try {
							const command = this.commandBuilder.buildCommand(promptFilePath, {
								...this.codexConfig,
								...options,
							});
							result = await Promise.race([
								this.processManager.executeCommand(
									command,
									workingDir,
									timeout,
								),
								this.createTimeoutPromise(timeout),
							]);
						} finally {
							// Cleanup temp file
							await this.cleanupTempFile(promptFilePath);
						}
					}

					// Validate result
					if (result.exitCode !== 0) {
						const error = new Error(
							result.error ||
								`Codex CLI failed with exit code ${result.exitCode}`,
						);
						(error as any).codexErrorType = ErrorType.EXECUTION_FAILED;
						(error as any).exitCode = result.exitCode;
						throw error;
					}

					return {
						exitCode: result.exitCode,
						output: result.output,
						error: result.error,
						filesModified: this.parseModifiedFiles(result.output || ""),
					};
				} finally {
					// No temp file used in headless path
				}
			},
			"Codex CLI Execution",
			{
				maxAttempts: 3,
				baseDelay: 1000,
				retryableErrors: [
					ErrorType.TIMEOUT,
					ErrorType.NETWORK_ERROR,
					ErrorType.EXECUTION_FAILED,
				],
				onRetry: async (attempt: number, error: Error) => {
					this.outputChannel.appendLine(
						`[CodexProvider] Retry attempt ${attempt} for Codex execution: ${error.message}`,
					);
				},
				shouldRetry: (error: any, _attempt: number) => {
					// Custom retry logic for specific scenarios
					const errorType = (error as any).codexErrorType;

					// Don't retry installation or permission errors
					if (
						errorType === ErrorType.CLI_NOT_INSTALLED ||
						errorType === ErrorType.PERMISSION_DENIED ||
						errorType === ErrorType.VERSION_INCOMPATIBLE
					) {
						return false;
					}

					// Retry execution failures only if exit code suggests transient issue
					if (errorType === ErrorType.EXECUTION_FAILED) {
						const exitCode = (error as any).exitCode;
						// Don't retry for syntax errors (exit code 1) but retry for network issues (exit code 2)
						return exitCode !== 1;
					}

					return true;
				},
			},
		);
	}

	/**
	 * Invoke Codex in a new terminal on the right side (split view)
	 */
	async invokeCodexSplitView(
		prompt: string,
		title: string = "Kiro for Codex",
	): Promise<vscode.Terminal> {
		return await this.retryService.executeWithRetry(
			async () => {
				// Check availability first
				const availabilityResult =
					await this.checkCodexInstallationAndCompatibility();
				if (!availabilityResult.isAvailable) {
					await this.showSetupGuidance(availabilityResult);
					const error = new Error(
						availabilityResult.errorMessage || "Codex CLI is not available",
					);
					(error as any).codexErrorType = availabilityResult.isInstalled
						? ErrorType.VERSION_INCOMPATIBLE
						: ErrorType.CLI_NOT_INSTALLED;
					throw error;
				}

				let promptFilePath: string | null = null;

				try {
					// Create temp file with the prompt (terminal path keeps file-based invocation)
					promptFilePath = await this.createTempFile(prompt, "codex-prompt");

					// Build command with OS-aware content loading
					let command: string;
					if (process.platform === "win32") {
						// Windows: Read file content in Node and pass as a (potentially large) string argument.
						// This is simpler but may hit command-line length limits.
						const promptContent = await fs.promises.readFile(
							promptFilePath,
							"utf8",
						);

						// For PowerShell, escape backticks and double-quotes within the string.
						const escapedPrompt = promptContent
							.replace(/`/g, "``")
							.replace(/"/g, "``");

						const modelPart = this.codexConfig.defaultModel
							? `-m "${this.codexConfig.defaultModel}"`
							: "";
						const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
						const cdPart = cwd ? `-C "${cwd}"` : "";

						const commandParts = [
							this.codexConfig.codexPath,
							modelPart,
							cdPart,
							"--",
							`"${escapedPrompt}"`, // Pass the escaped content as a single quoted argument
						];

						// Encoding setup is still good practice for the terminal environment itself.
						command = `$enc = [System.Text.Encoding]::UTF8; $OutputEncoding=$enc; [Console]::InputEncoding=$enc; [Console]::OutputEncoding=$enc; chcp 65001 > $null; ${commandParts.filter((p) => p).join(" ")}`;
					} else {
						// POSIX: legacy $(cat) is more robust for large prompts.
						command = this.commandBuilder.buildCommand(
							promptFilePath,
							this.codexConfig,
						);
					}

					// Choose location: if no editor is open, use Active; otherwise open in split (Two)
					const hasVisibleEditor =
						vscode.window.visibleTextEditors &&
						vscode.window.visibleTextEditors.length > 0;

					const locationOption = hasVisibleEditor
						? { viewColumn: vscode.ViewColumn.Two }
						: { viewColumn: vscode.ViewColumn.Active };

					const terminal = this.processManager.createTerminal(command, {
						name: title,
						cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
						location: locationOption,
						...(process.platform === "win32"
							? {
									shellPath: "powershell.exe",
									shellArgs: ["-NoLogo", "-NoProfile"],
								}
							: {}),
					} as any);

					// Schedule cleanup of temp file
					if (promptFilePath) {
						this.scheduleCleanup(promptFilePath, 30000);
					}

					return terminal;
				} catch (error) {
					// Clean up immediately on error
					if (promptFilePath) {
						this.cleanupTempFile(promptFilePath);
					}
					throw error;
				}
			},
			"Codex Split View",
			{
				maxAttempts: 2, // Fewer retries for terminal operations
				baseDelay: 500,
				retryableErrors: [
					ErrorType.FILE_ACCESS_ERROR,
					ErrorType.TEMP_FILE_ERROR,
				],
				onFailure: async (error: Error, _attempts: number) => {
					const codexError = this.errorHandler.analyzeError(error);
					await this.errorHandler.showErrorToUser(codexError);
				},
			},
		);
	}

	/**
	 * Execute Codex command in background (headless mode)
	 */
	async invokeCodexHeadless(
		prompt: string,
		options?: CodexOptions,
	): Promise<CodexResult> {
		this.outputChannel.appendLine(
			`[CodexProvider] Invoking Codex in headless mode`,
		);
		this.outputChannel.appendLine(`========================================`);
		this.outputChannel.appendLine(prompt);
		this.outputChannel.appendLine(`========================================`);

		try {
			return await this.executeCodex(prompt, options);
		} catch (error) {
			// For headless mode, we want to handle errors more gracefully
			const codexError = this.errorHandler.analyzeError(
				error instanceof Error ? error : String(error),
				{
					mode: "headless",
					prompt: `${prompt.substring(0, 100)}...`, // Truncated for logging
				},
			);

			// Log the error but don't show UI for headless operations
			this.outputChannel.appendLine(
				`[CodexProvider] Headless operation failed: ${codexError.message}`,
			);

			// Re-throw the original error to maintain API contract
			throw error;
		}
	}

	/**
	 * Execute Codex and stream output via callbacks. Returns a cancel controller.
	 */
	async executeCodexStream(
		prompt: string,
		options: CodexOptions | undefined,
		handlers: {
			onStdout?: (chunk: string) => void;
			onStderr?: (chunk: string) => void;
			onClose?: (exitCode: number) => void;
		},
	): Promise<{ cancel: () => void }> {
		const availabilityResult =
			await this.checkCodexInstallationAndCompatibility();
		if (!availabilityResult.isAvailable) {
			await this.showSetupGuidance(availabilityResult);
			const error = new Error(
				availabilityResult.errorMessage || "Codex CLI is not available",
			) as Error & { codexErrorType?: ErrorType };
			error.codexErrorType = availabilityResult.isInstalled
				? ErrorType.VERSION_INCOMPATIBLE
				: ErrorType.CLI_NOT_INSTALLED;
			throw error;
		}

		const workingDir =
			options?.workingDirectory ||
			vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		const args = (this.commandBuilder as any).buildArgs({
			...this.codexConfig,
			...options,
		}) as string[];

		const filteredArgs: string[] = [];
		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			if (arg === "-a") {
				i++;
				continue;
			}
			if (arg === "--full-auto") {
				continue;
			}
			filteredArgs.push(arg);
		}
		const execArgs = ["exec", ...filteredArgs, "-"];

		const controller = this.processManager.executeCommandArgsStream(
			this.codexConfig.codexPath,
			execArgs,
			{ cwd: workingDir, input: prompt },
			{
				onStdout: (chunk) => handlers.onStdout?.(chunk),
				onStderr: (chunk) => handlers.onStderr?.(chunk),
				onClose: (code) => handlers.onClose?.(code),
			},
		);

		return { cancel: controller.cancel };
	}

	/**
	 * Set the approval mode for Codex operations
	 */
	setApprovalMode(mode: ApprovalMode): void {
		this.codexConfig.defaultApprovalMode = mode;
		this.outputChannel.appendLine(
			`[CodexProvider] Approval mode set to: ${mode}`,
		);
	}

	/**
	 * Rename a terminal
	 */
	async renameTerminal(
		terminal: vscode.Terminal,
		newName: string,
	): Promise<void> {
		terminal.show();
		await new Promise((resolve) => setTimeout(resolve, 100));
		this.outputChannel.appendLine(
			`[CodexProvider] Terminal renamed to: ${newName}`,
		);

		await vscode.commands.executeCommand(
			"workbench.action.terminal.renameWithArg",
			{
				name: newName,
			},
		);
	}

	/**
	 * Create a temporary file with content
	 */
	private async createTempFile(
		content: string,
		prefix: string = "codex",
	): Promise<string> {
		const tempDir = this.context.globalStorageUri.fsPath;
		await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);

		const tempFile = path.join(tempDir, `${prefix}-${Date.now()}.md`);
		await fs.promises.writeFile(tempFile, content);

		return this.convertPathIfWSL(tempFile);
	}

	/**
	 * Convert Windows path to WSL path if needed
	 */
	private convertPathIfWSL(filePath: string): string {
		// Convert only when actually running under WSL context
		const isWindows = process.platform === "win32";
		const isWSL = Boolean(process.env.WSL_DISTRO_NAME || process.env.WSLENV);
		if (isWindows && isWSL && filePath.match(/^[A-Za-z]:\\/)) {
			let wslPath = filePath.replace(/\\/g, "/");
			wslPath = wslPath.replace(
				/^([A-Za-z]):/,
				(_match, drive) => `/mnt/${drive.toLowerCase()}`,
			);
			return wslPath;
		}
		return filePath;
	}

	/**
	 * Get current Codex configuration
	 */
	getCodexConfig(): CodexConfig {
		return { ...this.codexConfig };
	}

	/**
	 * Get Codex availability status without showing user guidance
	 */
	async getCodexAvailabilityStatus(): Promise<CodexAvailabilityResult> {
		return await this.checkCodexInstallationAndCompatibility();
	}

	/**
	 * Check if Codex CLI is ready for use (available and compatible)
	 */
	async isCodexReady(): Promise<boolean> {
		const result = await this.checkCodexInstallationAndCompatibility();
		return result.isAvailable;
	}

	/**
	 * Create a timeout promise for operation timeouts
	 */
	private createTimeoutPromise(timeoutMs: number): Promise<never> {
		return new Promise((_, reject) => {
			setTimeout(() => {
				const error = new Error(`Operation timed out after ${timeoutMs}ms`);
				(error as any).codexErrorType = ErrorType.TIMEOUT;
				reject(error);
			}, timeoutMs);
		});
	}

	/**
	 * Parse modified files from Codex CLI output
	 */
	private parseModifiedFiles(output: string): string[] {
		const modifiedFiles: string[] = [];

		// Look for common patterns in Codex output that indicate file modifications
		const patterns = [
			/Modified:\s+(.+)/gi,
			/Created:\s+(.+)/gi,
			/Updated:\s+(.+)/gi,
			/Writing to:\s+(.+)/gi,
		];

		patterns.forEach((pattern) => {
			let match = pattern.exec(output);
			while (match !== null) {
				const filePath = match[1].trim();
				if (filePath && !modifiedFiles.includes(filePath)) {
					modifiedFiles.push(filePath);
				}
				match = pattern.exec(output);
			}
		});

		return modifiedFiles;
	}

	/**
	 * Clean up temporary file immediately
	 */
	private async cleanupTempFile(filePath: string): Promise<void> {
		try {
			await fs.promises.unlink(filePath);
			this.outputChannel.appendLine(
				`[CodexProvider] Cleaned up temp file: ${filePath}`,
			);
		} catch (error) {
			this.outputChannel.appendLine(
				`[CodexProvider] Failed to cleanup temp file ${filePath}: ${error}`,
			);
		}
	}

	/**
	 * Schedule cleanup of temporary file after delay
	 */
	private scheduleCleanup(filePath: string, delayMs: number): void {
		setTimeout(async () => {
			await this.cleanupTempFile(filePath);
		}, delayMs);
	}

	/**
	 * Get error handler instance for external use
	 */
	getErrorHandler(): CodexErrorHandler {
		return this.errorHandler;
	}

	/**
	 * Get retry service instance for external use
	 */
	getRetryService(): RetryService {
		return this.retryService;
	}

	/**
	 * Get retry statistics for monitoring
	 */
	getRetryStatistics(): {
		activeCount: number;
		operations: string[];
	} {
		return this.retryService.getRetryStatistics();
	}

	/**
	 * Cancel all active retry operations
	 */
	cancelAllRetries(): void {
		this.retryService.cancelAllRetries();
	}
}
