import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mocked,
	vi,
} from "vitest";
import { SteeringManager } from "../../../../src/features/steering/steering-manager";
import type { CodexProvider } from "../../../../src/providers/codex-provider";

// Mock vscode
vi.mock("vscode", () => ({
	window: {
		showInputBox: vi.fn(),
		showErrorMessage: vi.fn(),
		withProgress: vi.fn(),
		showWarningMessage: vi.fn(),
	},
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/test/workspace" } }],
		fs: {
			createDirectory: vi.fn(),
			readDirectory: vi.fn(),
			stat: vi.fn(),
			delete: vi.fn(),
			writeFile: vi.fn(),
		},
		openTextDocument: vi.fn(),
	},
	Uri: {
		file: vi.fn((p) => ({ fsPath: p })),
	},
	FileType: { File: 1, Directory: 2 },
	ProgressLocation: { Notification: 15 },
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
const renderPromptMock = vi.fn(() => "mocked prompt content");
vi.mock("../../../../src/services/prompt-loader", () => ({
	PromptLoader: {
		getInstance: vi.fn(() => ({
			renderPrompt: renderPromptMock,
		})),
	},
}));

// Mock ConfigManager
const getPathMock = vi.fn((key: string) =>
	key === "steering" ? ".codex/steering" : "",
);
vi.mock("../../../../src/utils/config-manager", () => ({
	ConfigManager: {
		getInstance: vi.fn(() => ({
			loadSettings: vi.fn(),
			getPath: getPathMock,
		})),
	},
}));

describe("SteeringManager.createProjectDocumentation", () => {
	let steeringManager: SteeringManager;
	let mockCodexProvider: Mocked<CodexProvider>;
	let mockOutputChannel: any;

	beforeEach(() => {
		mockOutputChannel = {
			appendLine: vi.fn(),
			show: vi.fn(),
			dispose: vi.fn(),
		};

		mockCodexProvider = {
			invokeCodexSplitView: vi.fn().mockResolvedValue({} as any),
			getCodexConfig: vi.fn(() => ({ defaultApprovalMode: "interactive" })),
		} as unknown as Mocked<CodexProvider>;

		steeringManager = new SteeringManager(mockCodexProvider, mockOutputChannel);
		renderPromptMock.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the create-agents-md prompt with correct variables and invokes Codex", async () => {
		await steeringManager.createProjectDocumentation();

		expect(renderPromptMock).toHaveBeenCalledWith("create-agents-md", {
			steeringPath: ".codex/steering",
		});

		expect(mockCodexProvider.invokeCodexSplitView).toHaveBeenCalledWith(
			"mocked prompt content",
			"Codex -Create AGENTS.md",
		);
	});
});
