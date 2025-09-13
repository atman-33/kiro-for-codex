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
		if (approvalMode) parts.push(this.buildApprovalModeFlag(approvalMode));
		if (options.model || options.defaultModel)
			parts.push(`-m "${options.model || options.defaultModel}"`);
		if (options.workingDirectory)
			parts.push(this.buildWorkingDirectoryFlag(options.workingDirectory));
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
			const flag = this.buildApprovalModeFlag(approvalMode);
			if (flag === "--full-auto") args.push(flag);
			else args.push("-a", flag.replace(/^-a\s*/, ""));
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
	buildApprovalModeFlag(mode: ApprovalMode): string {
		switch (mode) {
			case ApprovalMode.Interactive:
				return "-a on-request";
			case ApprovalMode.AutoEdit:
				return "-a on-failure";
			case ApprovalMode.FullAuto:
				return "--full-auto";
			default:
				return "-a on-request";
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
			const flag = this.buildApprovalModeFlag(approvalMode);
			if (flag === "--full-auto") parts.push(flag);
			else parts.push("-a", this.escapeShellArg(flag.replace(/^-a\s*/, "")));
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

		// Add the prompt file using command substitution with escaped path
		parts.push(`"$(cat ${this.escapeShellArg(promptFilePath)})"`);

		return parts.join(" ");
	}
}
