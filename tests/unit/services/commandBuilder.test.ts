import { beforeEach, describe, expect, it } from '@jest/globals';
import { ApprovalMode } from '../../../src/providers/codexProvider';
import { CommandBuilder, CommandOptions } from '../../../src/services/commandBuilder';

describe('CommandBuilder', () => {
    let commandBuilder: CommandBuilder;

    beforeEach(() => {
        commandBuilder = new CommandBuilder();
    });

    describe('buildCommand', () => {
        it('should build basic command with default options', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain('codex');
            expect(command).toContain('--approval-mode interactive');
            expect(command).toContain(`"$(cat "${promptFilePath}")"`);
        });

        it('should include model flag when specified', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                model: 'gpt-4',
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain('--model "gpt-4"');
        });

        it('should include timeout flag when specified', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 60000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain('--timeout 60');
        });

        it('should include working directory flag when specified', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                workingDirectory: '/workspace/project',
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain('--cwd "/workspace/project"');
        });

        it('should override default approval mode with provided option', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                approvalMode: ApprovalMode.FullAuto,
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain('--approval-mode full-auto');
            expect(command).not.toContain('--approval-mode interactive');
        });

        it('should use custom codex path', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: '/usr/local/bin/codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command.startsWith('/usr/local/bin/codex')).toBe(true);
        });
    });

    describe('buildApprovalModeFlag', () => {
        it('should build interactive approval mode flag', () => {
            const flag = commandBuilder.buildApprovalModeFlag(ApprovalMode.Interactive);
            expect(flag).toBe('--approval-mode interactive');
        });

        it('should build auto-edit approval mode flag', () => {
            const flag = commandBuilder.buildApprovalModeFlag(ApprovalMode.AutoEdit);
            expect(flag).toBe('--approval-mode auto-edit');
        });

        it('should build full-auto approval mode flag', () => {
            const flag = commandBuilder.buildApprovalModeFlag(ApprovalMode.FullAuto);
            expect(flag).toBe('--approval-mode full-auto');
        });

        it('should default to interactive for unknown mode', () => {
            const flag = commandBuilder.buildApprovalModeFlag('unknown' as ApprovalMode);
            expect(flag).toBe('--approval-mode interactive');
        });
    });

    describe('buildWorkingDirectoryFlag', () => {
        it('should build working directory flag with quoted path', () => {
            const flag = commandBuilder.buildWorkingDirectoryFlag('/path/to/workspace');
            expect(flag).toBe('--cwd "/path/to/workspace"');
        });

        it('should handle paths with spaces', () => {
            const flag = commandBuilder.buildWorkingDirectoryFlag('/path with spaces/workspace');
            expect(flag).toBe('--cwd "/path with spaces/workspace"');
        });

        it('should handle Windows paths', () => {
            const flag = commandBuilder.buildWorkingDirectoryFlag('C:\\Users\\Developer\\Project');
            expect(flag).toBe('--cwd "C:\\Users\\Developer\\Project"');
        });
    });

    describe('buildVersionCommand', () => {
        it('should build version command with default codex path', () => {
            const command = commandBuilder.buildVersionCommand();
            expect(command).toBe('codex --version');
        });

        it('should build version command with custom codex path', () => {
            const command = commandBuilder.buildVersionCommand('/usr/local/bin/codex');
            expect(command).toBe('/usr/local/bin/codex --version');
        });
    });

    describe('buildHelpCommand', () => {
        it('should build help command with default codex path', () => {
            const command = commandBuilder.buildHelpCommand();
            expect(command).toBe('codex --help');
        });

        it('should build help command with custom codex path', () => {
            const command = commandBuilder.buildHelpCommand('/usr/local/bin/codex');
            expect(command).toBe('/usr/local/bin/codex --help');
        });
    });

    describe('buildSecureCommand', () => {
        it('should build secure command with escaped arguments', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                model: "gpt-4'malicious",
                workingDirectory: "/path'with'quotes",
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildSecureCommand(promptFilePath, options);

            expect(command).toContain("'gpt-4'\\''malicious'");
            expect(command).toContain("'/path'\\''with'\\''quotes'");
            expect(command).toContain("'interactive'");
        });

        it('should escape shell arguments properly', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                model: 'model; rm -rf /',
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildSecureCommand(promptFilePath, options);

            expect(command).toContain("'model; rm -rf /'");
            // The malicious command should be escaped within quotes
            expect(command).toMatch(/'model; rm -rf \/'/);
        });

        it('should handle empty values gracefully', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                model: '', // Empty string is falsy, so won't be included
                defaultModel: 'fallback-model', // This will be used instead
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildSecureCommand(promptFilePath, options);

            // Should use defaultModel when model is empty
            expect(command).toContain("--model 'fallback-model'");
        });
    });

    describe('Complex Command Building', () => {
        it('should build complete command with all options', () => {
            const promptFilePath = '/tmp/complex-prompt.md';
            const options: CommandOptions = {
                codexPath: '/usr/local/bin/codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                approvalMode: ApprovalMode.AutoEdit,
                model: 'gpt-4-turbo',
                workingDirectory: '/workspace/my-project',
                timeout: 120000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain('/usr/local/bin/codex');
            expect(command).toContain('--approval-mode auto-edit');
            expect(command).toContain('--model "gpt-4-turbo"');
            expect(command).toContain('--timeout 120');
            expect(command).toContain('--cwd "/workspace/my-project"');
            expect(command).toContain(`"$(cat "${promptFilePath}")"`);
        });

        it('should maintain correct argument order', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                approvalMode: ApprovalMode.FullAuto,
                model: 'gpt-4',
                workingDirectory: '/workspace',
                timeout: 60000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);
            const parts = command.split(' ');

            expect(parts[0]).toBe('codex');
            expect(parts.indexOf('--approval-mode')).toBeLessThan(parts.indexOf('--model'));
            expect(parts.indexOf('--model')).toBeLessThan(parts.indexOf('--timeout'));
            expect(parts.indexOf('--timeout')).toBeLessThan(parts.indexOf('--cwd'));
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined codex path', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: undefined as any,
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command.startsWith('codex')).toBe(true);
        });

        it('should handle zero timeout', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 0,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            // Zero timeout should not be included (falsy check in implementation)
            expect(command).not.toContain('--timeout');
        });

        it('should handle very large timeout', () => {
            const promptFilePath = '/tmp/prompt.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 999999999,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain('--timeout 999999');
        });

        it('should handle special characters in file path', () => {
            const promptFilePath = '/tmp/prompt with spaces & symbols.md';
            const options: CommandOptions = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 30000,
                terminalDelay: 1000,
            };

            const command = commandBuilder.buildCommand(promptFilePath, options);

            expect(command).toContain(`"$(cat "${promptFilePath}")"`);
        });
    });
});