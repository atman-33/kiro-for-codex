import { ApprovalMode } from '../../../src/providers/codexProvider';
import { CommandBuilder } from '../../../src/services/commandBuilder';

describe('CommandBuilder', () => {
    let commandBuilder: CommandBuilder;

    beforeEach(() => {
        commandBuilder = new CommandBuilder();
    });

    describe('buildApprovalModeFlag', () => {
        it('should build interactive approval mode flag', () => {
            const result = commandBuilder.buildApprovalModeFlag(ApprovalMode.Interactive);
            expect(result).toBe('--approval-mode interactive');
        });

        it('should build auto-edit approval mode flag', () => {
            const result = commandBuilder.buildApprovalModeFlag(ApprovalMode.AutoEdit);
            expect(result).toBe('--approval-mode auto-edit');
        });

        it('should build full-auto approval mode flag', () => {
            const result = commandBuilder.buildApprovalModeFlag(ApprovalMode.FullAuto);
            expect(result).toBe('--approval-mode full-auto');
        });

        it('should default to interactive for unknown mode', () => {
            const result = commandBuilder.buildApprovalModeFlag('unknown' as ApprovalMode);
            expect(result).toBe('--approval-mode interactive');
        });
    });

    describe('buildWorkingDirectoryFlag', () => {
        it('should build working directory flag', () => {
            const result = commandBuilder.buildWorkingDirectoryFlag('/path/to/dir');
            expect(result).toBe('--cwd "/path/to/dir"');
        });
    });

    describe('buildVersionCommand', () => {
        it('should build version command with default path', () => {
            const result = commandBuilder.buildVersionCommand();
            expect(result).toBe('codex --version');
        });

        it('should build version command with custom path', () => {
            const result = commandBuilder.buildVersionCommand('/usr/local/bin/codex');
            expect(result).toBe('/usr/local/bin/codex --version');
        });
    });

    describe('buildHelpCommand', () => {
        it('should build help command with default path', () => {
            const result = commandBuilder.buildHelpCommand();
            expect(result).toBe('codex --help');
        });

        it('should build help command with custom path', () => {
            const result = commandBuilder.buildHelpCommand('/usr/local/bin/codex');
            expect(result).toBe('/usr/local/bin/codex --help');
        });
    });

    describe('buildCommand', () => {
        it('should build complete command with all options', () => {
            const options = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                approvalMode: ApprovalMode.AutoEdit,
                model: 'gpt-5',
                timeout: 30000,
                workingDirectory: '/test/dir',
                terminalDelay: 1000
            };

            const result = commandBuilder.buildCommand('/path/to/prompt.md', options);

            expect(result).toContain('codex');
            expect(result).toContain('--approval-mode auto-edit');
            expect(result).toContain('--model "gpt-5"');
            expect(result).toContain('--timeout 30');
            expect(result).toContain('--cwd "/test/dir"');
            expect(result).toContain('"$(cat "/path/to/prompt.md")"');
        });

        it('should use default approval mode when not specified', () => {
            const options = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.FullAuto,
                timeout: 30000,
                terminalDelay: 1000
            };

            const result = commandBuilder.buildCommand('/path/to/prompt.md', options);

            expect(result).toContain('--approval-mode full-auto');
        });

        it('should use default model when not specified', () => {
            const options = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                defaultModel: 'gpt-3.5-turbo',
                timeout: 30000,
                terminalDelay: 1000
            };

            const result = commandBuilder.buildCommand('/path/to/prompt.md', options);

            expect(result).toContain('--model "gpt-3.5-turbo"');
        });

        it('should handle minimal options', () => {
            const options = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                timeout: 30000,
                terminalDelay: 1000
            };

            const result = commandBuilder.buildCommand('/path/to/prompt.md', options);

            expect(result).toContain('codex');
            expect(result).toContain('--approval-mode interactive');
            expect(result).toContain('"$(cat "/path/to/prompt.md")"');
            expect(result).not.toContain('--model');
            expect(result).not.toContain('--cwd');
        });
    });

    describe('buildSecureCommand', () => {
        it('should escape shell arguments properly', () => {
            const options = {
                codexPath: 'codex',
                defaultApprovalMode: ApprovalMode.Interactive,
                model: "test'model",
                workingDirectory: "/path/with spaces/dir",
                timeout: 30000,
                terminalDelay: 1000
            };

            const result = commandBuilder.buildSecureCommand("/path/to/prompt.md", options);

            expect(result).toContain("'test'\\''model'"); // Escaped single quote
            expect(result).toContain("'/path/with spaces/dir'"); // Escaped spaces
        });
    });
});