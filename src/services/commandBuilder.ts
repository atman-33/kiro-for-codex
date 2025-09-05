import { ApprovalMode, CodexConfig } from '../providers/codexProvider';

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
        const parts: string[] = [options.codexPath || 'codex'];

        // Add approval mode flag
        const approvalMode = options.approvalMode || options.defaultApprovalMode;
        if (approvalMode) {
            parts.push(this.buildApprovalModeFlag(approvalMode));
        }

        // Add model flag if specified
        if (options.model || options.defaultModel) {
            parts.push(`--model "${options.model || options.defaultModel}"`);
        }

        // Add timeout flag if specified
        if (options.timeout) {
            parts.push(`--timeout ${Math.floor(options.timeout / 1000)}`);
        }

        // Add working directory flag if specified
        if (options.workingDirectory) {
            parts.push(this.buildWorkingDirectoryFlag(options.workingDirectory));
        }

        // Add the prompt file using command substitution
        parts.push(`"$(cat "${promptFilePath}")"`);

        return parts.join(' ');
    }

    /**
     * Build approval mode flag for Codex CLI
     */
    buildApprovalModeFlag(mode: ApprovalMode): string {
        switch (mode) {
            case ApprovalMode.Interactive:
                return '--approval-mode interactive';
            case ApprovalMode.AutoEdit:
                return '--approval-mode auto-edit';
            case ApprovalMode.FullAuto:
                return '--approval-mode full-auto';
            default:
                return '--approval-mode interactive';
        }
    }

    /**
     * Build working directory flag for Codex CLI
     */
    buildWorkingDirectoryFlag(path: string): string {
        return `--cwd "${path}"`;
    }

    /**
     * Build a simple command for version checking
     */
    buildVersionCommand(codexPath: string = 'codex'): string {
        return `${codexPath} --version`;
    }

    /**
     * Build a help command
     */
    buildHelpCommand(codexPath: string = 'codex'): string {
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
        const parts: string[] = [options.codexPath || 'codex'];

        // Add approval mode flag
        const approvalMode = options.approvalMode || options.defaultApprovalMode;
        if (approvalMode) {
            parts.push('--approval-mode', this.escapeShellArg(approvalMode));
        }

        // Add model flag if specified
        if (options.model || options.defaultModel) {
            parts.push('--model', this.escapeShellArg(options.model || options.defaultModel || ''));
        }

        // Add timeout flag if specified
        if (options.timeout) {
            parts.push('--timeout', this.escapeShellArg(Math.floor(options.timeout / 1000).toString()));
        }

        // Add working directory flag if specified
        if (options.workingDirectory) {
            parts.push('--cwd', this.escapeShellArg(options.workingDirectory));
        }

        // Add the prompt file using command substitution with escaped path
        parts.push(`"$(cat ${this.escapeShellArg(promptFilePath)})"`);

        return parts.join(' ');
    }
}