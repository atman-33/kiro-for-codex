import { ApprovalMode, type CodexConfig } from "../providers/codex-provider";

export interface CommandOptions extends CodexConfig {
	approvalMode?: ApprovalMode;
	workingDirectory?: string;
	model?: string;
}

export class CommandBuilder {
	/**
	 * Build a complete Codex CLI command with all options
	 */
	buildCommand(promptFilePath: string, options: CommandOptions): string {
		// POSIX terminals (Split View)
		const parts: string[] = [options.codexPath || "codex"];
		const approvalMode = options.approvalMode || options.defaultApprovalMode;
		if (approvalMode) parts.push(...this.buildApprovalModeArgs(approvalMode));
		if (options.model || options.defaultModel)
			parts.push(`-m "${options.model || options.defaultModel}"`);
		if (options.workingDirectory)
			parts.push(this.buildWorkingDirectoryFlag(options.workingDirectory));
		// Prevent subcommand interpretation (e.g., input 'a' -> 'apply')
		parts.push("--");
		parts.push(`"$(cat "${promptFilePath}")"`);
		return parts.join(" ");
	}

	/**
	 * Build argv-style flags (no prompt content) for non-shell execution.
	 */
	buildArgs(options: CommandOptions): string[] {
		const args: string[] = [];
		const approvalMode = options.approvalMode || options.defaultApprovalMode;
		if (approvalMode) {
			args.push(...this.buildApprovalModeArgs(approvalMode));
		}
		if (options.model || options.defaultModel) {
			args.push("-m", String(options.model || options.defaultModel));
		}
		if (options.workingDirectory) {
			args.push("-C", options.workingDirectory);
		}
		return args;
	}

	/**
	 * Build approval mode flag for Codex CLI
	 */
	buildApprovalModeArgs(mode: ApprovalMode): string[] {
		switch (mode) {
			case ApprovalMode.FullAuto:
				return [
					"-s",
					"workspace-write",
					"--full-auto",
					"--skip-git-repo-check",
				];
			case ApprovalMode.Yolo:
				return [
					"--dangerously-bypass-approvals-and-sandbox",
					"--skip-git-repo-check",
				];
			default:
				return [
					"-s",
					"workspace-write",
					"--full-auto",
					"--skip-git-repo-check",
				];
		}
	}

	buildResumeArgs(mode: ApprovalMode): string[] {
		switch (mode) {
			case ApprovalMode.FullAuto:
				return ["-s", "workspace-write", "-a", "on-failure"];
			case ApprovalMode.Yolo:
				return ["--dangerously-bypass-approvals-and-sandbox"];
			default:
				return ["-s", "workspace-write", "-a", "on-failure"];
		}
	}

	/**
	 * Build working directory flag for Codex CLI
	 */
	buildWorkingDirectoryFlag(path: string): string {
		return `-C "${path}"`;
	}

	/**
	 * Build a simple command for version checking
	 */
	buildVersionCommand(codexPath: string = "codex"): string {
		return `${codexPath} --version`;
	}

	/**
	 * Build a help command
	 */
	buildHelpCommand(codexPath: string = "codex"): string {
		return `${codexPath} --help`;
	}

	/**
	 * Escape shell arguments to prevent command injection
	 */
	private escapeShellArg(arg: string): string {
		// Replace single quotes with '\'' and wrap in single quotes
		return `'${arg.replace(/'/g, "'\\''")}'`;
	}

	/**
	 * Build command with escaped arguments for security
	 */
	buildSecureCommand(promptFilePath: string, options: CommandOptions): string {
		const parts: string[] = [options.codexPath || "codex"];

		// Add approval mode flag
		const approvalMode = options.approvalMode || options.defaultApprovalMode;
		if (approvalMode) {
			const approvalArgs = this.buildApprovalModeArgs(approvalMode);
			for (const arg of approvalArgs) {
				if (arg.startsWith("-")) parts.push(arg);
				else parts.push(this.escapeShellArg(arg));
			}
		}
		if (options.model || options.defaultModel) {
			parts.push(
				"-m",
				this.escapeShellArg(options.model || options.defaultModel || ""),
			);
		}
		if (options.workingDirectory) {
			parts.push("-C", this.escapeShellArg(options.workingDirectory));
		}

		// Prevent subcommand interpretation
		parts.push("--");
		// Add the prompt file using command substitution with escaped path
		parts.push(`"$(cat ${this.escapeShellArg(promptFilePath)})"`);

		return parts.join(" ");
	}
}
