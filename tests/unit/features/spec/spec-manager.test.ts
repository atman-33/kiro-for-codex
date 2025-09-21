import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mocked,
} from "vitest";
import * as vscode from "vscode";
import { SpecManager } from "../../../../src/features/spec/spec-manager";
import type { CodexProvider } from "../../../../src/providers/codex-provider";

// Mock vscode
vi.mock("vscode", () => ({
	window: {
		showInputBox: vi.fn(),
	},
	workspace: {
		workspaceFolders: [
			{
				uri: { fsPath: "/test/workspace" },
			},
		],
		createFileSystemWatcher: vi.fn(() => ({
			onDidCreate: vi.fn(),
			onDidChange: vi.fn(),
			onDidDelete: vi.fn(),
			dispose: vi.fn(),
		})),
	},
	RelativePattern: vi.fn(),
}));

// Mock CodexProvider
vi.mock("../../../../src/providers/codex-provider");

// Mock NotificationUtils
vi.mock("../../../../src/utils/notification-utils", () => ({
	NotificationUtils: {
		showAutoDismissNotification: vi.fn(),
	},
}));

// Mock PromptLoader
vi.mock("../../../../src/services/prompt-loader", () => ({
	PromptLoader: {
		getInstance: vi.fn(() => ({
			renderPrompt: vi.fn().mockReturnValue("mocked prompt content"),
		})),
	},
}));

describe("SpecManager with CodexProvider Integration", () => {
	let specManager: SpecManager;
	let mockCodexProvider: Mocked<CodexProvider>;
	let mockOutputChannel: any;

	beforeEach(() => {
		mockOutputChannel = {
			appendLine: vi.fn(),
			show: vi.fn(),
			dispose: vi.fn(),
		};

		mockCodexProvider = {
			isCodexReady: vi.fn(),
			getCodexAvailabilityStatus: vi.fn(),
			showSetupGuidance: vi.fn(),
			getCodexConfig: vi.fn(),
			executePlan: vi.fn(),
			renameTerminal: vi.fn(),
			setApprovalMode: vi.fn(),
		} as any;

		specManager = new SpecManager(mockCodexProvider, mockOutputChannel);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Codex Integration", () => {
		it("should check Codex availability before creating spec", async () => {
			// Arrange
			mockCodexProvider.isCodexReady.mockResolvedValue(false);
			mockCodexProvider.getCodexAvailabilityStatus.mockResolvedValue({
				isAvailable: false,
				isInstalled: false,
				version: null,
				isCompatible: false,
				errorMessage: "Codex CLI not found",
				setupGuidance: "Please install Codex CLI",
			});

			vi.spyOn(vscode.window, "showInputBox").mockResolvedValue("Test feature");

			// Act
			await specManager.create();

			// Assert
			expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
			expect(mockCodexProvider.getCodexAvailabilityStatus).toHaveBeenCalled();
			expect(mockCodexProvider.showSetupGuidance).toHaveBeenCalled();
			expect(mockCodexProvider.executePlan).not.toHaveBeenCalled();
		});

		it("should use CodexProvider when Codex is ready", async () => {
			// Arrange
			mockCodexProvider.isCodexReady.mockResolvedValue(true);
			mockCodexProvider.getCodexConfig.mockReturnValue({
				codexPath: "codex",
				defaultApprovalMode: "interactive" as any,
				defaultModel: "gpt-5",
				timeout: 30000,
				terminalDelay: 1000,
			});
			mockCodexProvider.executePlan.mockResolvedValue({} as any);

			vi.spyOn(vscode.window, "showInputBox").mockResolvedValue("Test feature");

			// Act
			await specManager.create();

			// Assert
			expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
			expect(mockCodexProvider.executePlan).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: "splitView",
					title: "Codex -Creating Spec",
				}),
			);
		});

		it("should use Codex-specific prompts for task implementation", async () => {
			// Arrange
			mockCodexProvider.isCodexReady.mockResolvedValue(true);
			mockCodexProvider.getCodexConfig.mockReturnValue({
				codexPath: "codex",
				defaultApprovalMode: "interactive" as any,
				defaultModel: "gpt-5",
				timeout: 30000,
				terminalDelay: 1000,
			});
			mockCodexProvider.executePlan.mockResolvedValue({} as any);

			// Act
			await specManager.implTask("/test/tasks.md", "Test task description");

			// Assert
			expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
			expect(mockCodexProvider.executePlan).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: "splitView",
					title: "Codex -Implementing Task",
				}),
			);
		});

		it("should provide Codex status information", async () => {
			// Arrange
			mockCodexProvider.isCodexReady.mockResolvedValue(true);
			mockCodexProvider.getCodexConfig.mockReturnValue({
				codexPath: "codex",
				defaultApprovalMode: "interactive" as any,
				defaultModel: "gpt-5",
				timeout: 30000,
				terminalDelay: 1000,
			});

			// Act
			const status = await specManager.getCodexStatus();

			// Assert
			expect(status.isReady).toBe(true);
			expect(status.config).toBeDefined();
			expect(mockCodexProvider.isCodexReady).toHaveBeenCalled();
			expect(mockCodexProvider.getCodexConfig).toHaveBeenCalled();
		});

		it("should set Codex approval mode", () => {
			// Act
			specManager.setCodexApprovalMode("auto-edit");

			// Assert
			expect(mockCodexProvider.setApprovalMode).toHaveBeenCalledWith(
				"auto-edit",
			);
			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				"[SpecManager] Codex approval mode set to: auto-edit",
			);
		});
	});
});
