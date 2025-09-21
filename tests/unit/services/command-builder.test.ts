import { beforeEach, describe, expect, it } from "vitest";
import { ApprovalMode } from "../../../src/providers/codex-provider";
import {
	CommandBuilder,
	type CommandOptions,
} from "../../../src/services/command-builder";

describe("CommandBuilder", () => {
	let commandBuilder: CommandBuilder;

	beforeEach(() => {
		commandBuilder = new CommandBuilder();
	});

	describe("buildCommand", () => {
		3;
		it("should build basic command with default options", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain("codex");
			// Interactive mode defaults to read-only sandbox with no approval prompts
			expect(command).toContain("--sandbox read-only --ask-for-approval never");
			expect(command).toContain(`"$(cat "${promptFilePath}")"`);
		});

		it("should include model flag when specified", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				model: "gpt-4",
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain('-m "gpt-4"');
		});

		// Timeout flag is not used by the current CLI; no expectation here

		it("should include working directory flag when specified", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				workingDirectory: "/workspace/project",
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain('-C "/workspace/project"');
		});

		it("should override default approval mode with provided option", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				approvalMode: ApprovalMode.FullAuto,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain("--full-auto");
			expect(command).not.toContain("--ask-for-approval never");
		});

		it("should use custom codex path", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "/usr/local/bin/codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command.startsWith("/usr/local/bin/codex")).toBe(true);
		});
	});

	describe("buildApprovalModeArgs", () => {
		it("should build interactive approval mode args", () => {
			const args = commandBuilder.buildApprovalModeArgs(
				ApprovalMode.Interactive,
			);
			expect(args).toEqual([
				"--sandbox",
				"read-only",
				"--ask-for-approval",
				"never",
			]);
		});

		it("should build auto-edit approval mode args", () => {
			const args = commandBuilder.buildApprovalModeArgs(ApprovalMode.AutoEdit);
			expect(args).toEqual([
				"--sandbox",
				"workspace-write",
				"--ask-for-approval",
				"on-request",
			]);
		});

		it("should build full-auto approval mode args", () => {
			const args = commandBuilder.buildApprovalModeArgs(ApprovalMode.FullAuto);
			expect(args).toEqual(["--full-auto"]);
		});

		it("should default to interactive for unknown mode", () => {
			const args = commandBuilder.buildApprovalModeArgs(
				"unknown" as ApprovalMode,
			);
			expect(args).toEqual([
				"--sandbox",
				"read-only",
				"--ask-for-approval",
				"on-request",
			]);
		});
	});

	describe("buildWorkingDirectoryFlag", () => {
		it("should build working directory flag with quoted path", () => {
			const flag =
				commandBuilder.buildWorkingDirectoryFlag("/path/to/workspace");
			expect(flag).toBe('-C "/path/to/workspace"');
		});

		it("should handle paths with spaces", () => {
			const flag = commandBuilder.buildWorkingDirectoryFlag(
				"/path with spaces/workspace",
			);
			expect(flag).toBe('-C "/path with spaces/workspace"');
		});

		it("should handle Windows paths", () => {
			const flag = commandBuilder.buildWorkingDirectoryFlag(
				"C:\\Users\\Developer\\Project",
			);
			expect(flag).toBe('-C "C:\\Users\\Developer\\Project"');
		});
	});

	describe("buildVersionCommand", () => {
		it("should build version command with default codex path", () => {
			const command = commandBuilder.buildVersionCommand();
			expect(command).toBe("codex --version");
		});

		it("should build version command with custom codex path", () => {
			const command = commandBuilder.buildVersionCommand(
				"/usr/local/bin/codex",
			);
			expect(command).toBe("/usr/local/bin/codex --version");
		});
	});

	describe("buildHelpCommand", () => {
		it("should build help command with default codex path", () => {
			const command = commandBuilder.buildHelpCommand();
			expect(command).toBe("codex --help");
		});

		it("should build help command with custom codex path", () => {
			const command = commandBuilder.buildHelpCommand("/usr/local/bin/codex");
			expect(command).toBe("/usr/local/bin/codex --help");
		});
	});

	describe("buildSecureCommand", () => {
		it("should build secure command with escaped arguments", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				model: "gpt-4'malicious",
				workingDirectory: "/path'with'quotes",
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildSecureCommand(
				promptFilePath,
				options,
			);

			expect(command).toContain("'gpt-4'\\''malicious'");
			expect(command).toContain("'/path'\\''with'\\''quotes'");
			// Interactive maps to read-only sandbox with no approvals
			expect(command).toContain("'never'");
		});

		it("should escape shell arguments properly", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				model: "model; rm -rf /",
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildSecureCommand(
				promptFilePath,
				options,
			);

			expect(command).toContain("'model; rm -rf /'");
			// The malicious command should be escaped within quotes
			expect(command).toMatch(/'model; rm -rf \/'/);
		});

		it("should handle empty values gracefully", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				model: "", // Empty string is falsy, so won't be included
				defaultModel: "fallback-model", // This will be used instead
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildSecureCommand(
				promptFilePath,
				options,
			);

			// Should use defaultModel when model is empty
			expect(command).toContain("-m 'fallback-model'");
		});
	});

	describe("Complex Command Building", () => {
		it("should build complete command with all options", () => {
			const promptFilePath = "/tmp/complex-prompt.md";
			const options: CommandOptions = {
				codexPath: "/usr/local/bin/codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				approvalMode: ApprovalMode.AutoEdit,
				model: "gpt-4-turbo",
				workingDirectory: "/workspace/my-project",
				timeout: 120000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain("/usr/local/bin/codex");
			expect(command).toContain(
				"--sandbox workspace-write --ask-for-approval on-request",
			);
			expect(command).toContain('-m "gpt-4-turbo"');
			expect(command).toContain('-C "/workspace/my-project"');
			expect(command).toContain(`"$(cat "${promptFilePath}")"`);
		});

		it("should maintain correct argument order", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				approvalMode: ApprovalMode.FullAuto,
				model: "gpt-4",
				workingDirectory: "/workspace",
				timeout: 60000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);
			const parts = command.split(" ");

			expect(parts[0]).toBe("codex");
			// FullAuto uses --full-auto instead of -a
			expect(parts.indexOf("--full-auto")).toBeGreaterThan(-1);
			expect(parts.indexOf("-m")).toBeGreaterThan(-1);
			expect(parts.indexOf("-C")).toBeGreaterThan(-1);
			expect(parts.indexOf("--full-auto")).toBeLessThan(parts.indexOf("-m"));
			expect(parts.indexOf("-m")).toBeLessThan(parts.indexOf("-C"));
		});
	});

	describe("Edge Cases", () => {
		it("should handle undefined codex path", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: undefined as any,
				defaultApprovalMode: ApprovalMode.Interactive,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command.startsWith("codex")).toBe(true);
		});

		it("should handle zero timeout", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				timeout: 0,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			// Timeout flag is not emitted by current implementation
			expect(command).not.toContain("--timeout");
		});

		it("should handle very large timeout", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				timeout: 999999999,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			// Timeout flag not supported; ensure it isn't present
			expect(command).not.toContain("--timeout");
		});

		it("should handle special characters in file path", () => {
			const promptFilePath = "/tmp/prompt with spaces & symbols.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.Interactive,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain(`"$(cat "${promptFilePath}")"`);
		});
	});
});
