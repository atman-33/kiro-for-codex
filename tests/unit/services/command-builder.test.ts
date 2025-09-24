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
				defaultApprovalMode: ApprovalMode.FullAuto,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain("codex");
			// Interactive mode defaults to read-only sandbox with no approval prompts
			expect(command).toContain(
				"-s workspace-write --full-auto --skip-git-repo-check",
			);
			expect(command).toContain(`"$(cat "${promptFilePath}")"`);
		});

		it("should include model flag when specified", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.FullAuto,
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
				defaultApprovalMode: ApprovalMode.FullAuto,
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
				defaultApprovalMode: ApprovalMode.FullAuto,
				approvalMode: ApprovalMode.Yolo,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain(
				"--dangerously-bypass-approvals-and-sandbox --skip-git-repo-check",
			);
			expect(command).not.toContain("--full-auto");
		});

		it("should use custom codex path", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "/usr/local/bin/codex",
				defaultApprovalMode: ApprovalMode.FullAuto,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command.startsWith("/usr/local/bin/codex")).toBe(true);
		});
	});

	describe("buildApprovalModeArgs", () => {
		it("should build yolo approval mode args", () => {
			const args = commandBuilder.buildApprovalModeArgs(ApprovalMode.Yolo);
			expect(args).toEqual([
				"--dangerously-bypass-approvals-and-sandbox",
				"--skip-git-repo-check",
			]);
		});

		it("should build full-auto approval mode args", () => {
			const args = commandBuilder.buildApprovalModeArgs(ApprovalMode.FullAuto);
			expect(args).toEqual([
				"-s",
				"workspace-write",
				"--full-auto",
				"--skip-git-repo-check",
			]);
		});

		it("should default to full-auto for unknown mode", () => {
			const args = commandBuilder.buildApprovalModeArgs(
				"unknown" as ApprovalMode,
			);
			expect(args).toEqual([
				"-s",
				"workspace-write",
				"--full-auto",
				"--skip-git-repo-check",
			]);
		});
	});

	describe("buildResumeArgs", () => {
		it("should build full-auto resume args", () => {
			const args = commandBuilder.buildResumeArgs(ApprovalMode.FullAuto);
			expect(args).toEqual(["-s", "workspace-write", "-a", "on-failure"]);
		});

		it("should build yolo resume args", () => {
			const args = commandBuilder.buildResumeArgs(ApprovalMode.Yolo);
			expect(args).toEqual(["--dangerously-bypass-approvals-and-sandbox"]);
		});

		it("should default to full-auto for unknown mode", () => {
			const args = commandBuilder.buildResumeArgs("unknown" as ApprovalMode);
			expect(args).toEqual(["-s", "workspace-write", "-a", "on-failure"]);
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
				defaultApprovalMode: ApprovalMode.FullAuto,
				model: "gpt-4'malicious",
				workingDirectory: "/path'with'quotes",
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildSecureCommand(
				promptFilePath,
				options,
			);

			expect(command).toContain(
				commandBuilder["escapeShellArg"]("gpt-4'malicious"),
			);
			expect(command).toContain(
				commandBuilder["escapeShellArg"]("/path'with'quotes"),
			);
			// FullAuto uses explicit sandbox and approval flags instead of -a
			expect(command).toContain("workspace-write");
		});

		it("should escape shell arguments properly", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.FullAuto,
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
				defaultApprovalMode: ApprovalMode.FullAuto,
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
				defaultApprovalMode: ApprovalMode.FullAuto,
				approvalMode: ApprovalMode.Yolo,
				model: "gpt-4-turbo",
				workingDirectory: "/workspace/my-project",
				timeout: 120000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain("/usr/local/bin/codex");
			expect(command).toContain(
				"--dangerously-bypass-approvals-and-sandbox --skip-git-repo-check",
			);
			expect(command).toContain('-m "gpt-4-turbo"');
			expect(command).toContain('-C "/workspace/my-project"');
			expect(command).toContain(`"$(cat "${promptFilePath}")"`);
		});

		it("should maintain correct argument order", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: "codex",
				defaultApprovalMode: ApprovalMode.FullAuto,
				approvalMode: ApprovalMode.Yolo,
				model: "gpt-4",
				workingDirectory: "/workspace",
				timeout: 60000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);
			const parts = command.split(" ");

			expect(parts[0]).toBe("codex");
			// FullAuto uses explicit sandbox and approval flags instead of -a
			const sandboxIndex = parts.indexOf(
				"--dangerously-bypass-approvals-and-sandbox",
			);
			const skipGitIndex = parts.indexOf("--skip-git-repo-check");
			expect(sandboxIndex).toBeGreaterThan(-1);
			expect(skipGitIndex).toBeGreaterThan(sandboxIndex);
			const modelIndex = parts.indexOf("-m");
			const cwdIndex = parts.indexOf("-C");
			expect(modelIndex).toBeGreaterThan(-1);
			expect(cwdIndex).toBeGreaterThan(-1);
			expect(skipGitIndex).toBeLessThan(modelIndex);
			expect(modelIndex).toBeLessThan(cwdIndex);
		});
	});

	describe("Edge Cases", () => {
		it("should handle undefined codex path", () => {
			const promptFilePath = "/tmp/prompt.md";
			const options: CommandOptions = {
				codexPath: undefined as any,
				defaultApprovalMode: ApprovalMode.FullAuto,
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
				defaultApprovalMode: ApprovalMode.FullAuto,
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
				defaultApprovalMode: ApprovalMode.FullAuto,
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
				defaultApprovalMode: ApprovalMode.FullAuto,
				timeout: 30000,
				terminalDelay: 1000,
			};

			const command = commandBuilder.buildCommand(promptFilePath, options);

			expect(command).toContain(`"$(cat "${promptFilePath}")"`);
		});
	});
});
