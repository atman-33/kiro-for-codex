import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
	type Mocked,
} from "vitest";
import * as vscode from "vscode";
import {
	ApprovalMode,
	CodexProvider,
} from "../../src/providers/codex-provider";

const recordedTerminals: string[] = [];
const recordedExecCalls: Array<{
	executable: string;
	args: string[];
	options: any;
}> = [];
const processManagerInstances: any[] = [];

vi.mock("../../src/services/process-manager", () => {
	return {
		ProcessManager: class {
			executeCommandArgs = vi.fn(
				async (executable: string, args: string[], options: any) => {
					recordedExecCalls.push({ executable, args, options });
					return { exitCode: 0, output: "", error: "" };
				},
			);
			executeCommandArgsStream = vi.fn(async () => ({
				processId: "stub",
				cancel: vi.fn(),
			}));
			executeCommand = vi.fn(async () => ({
				exitCode: 0,
				output: "codex version 1.2.3",
				error: "",
			}));
			executeCommandWithShellIntegration = vi.fn();
			createTerminal = vi.fn((command: string) => {
				recordedTerminals.push(command);
				return { show: vi.fn(), sendText: vi.fn(), dispose: vi.fn() };
			});
			killProcess = vi.fn();
			killAllProcesses = vi.fn();
			getActiveProcessCount = vi.fn(() => 0);
			dispose = vi.fn();

			constructor() {
				processManagerInstances.push(this);
			}
		},
	};
});

vi.mock("../../src/services/codex-setup-service", () => ({
	CodexSetupService: {
		getInstance: vi.fn().mockReturnValue({
			getInstallationGuidance: vi.fn(),
			getVersionUpgradeGuidance: vi.fn(),
			getPermissionGuidance: vi.fn(),
			getTroubleshootingGuidance: vi.fn(),
			showSetupGuidance: vi.fn(),
		}),
	},
}));

vi.mock("../../src/services/retry-service", () => ({
	RetryService: class {
		executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
			return operation();
		}
		getRetryStatistics() {
			return { activeCount: 0, operations: [] as string[] };
		}
		cancelAllRetries() {}
	},
}));

vi.mock("../../src/services/error-handler", () => ({
	CodexErrorHandler: class {
		analyzeError(error: unknown) {
			return error as Error;
		}
		showErrorToUser() {}
	},
	ErrorType: {
		TIMEOUT: "timeout",
		NETWORK_ERROR: "network",
		EXECUTION_FAILED: "exec",
		CLI_NOT_INSTALLED: "cli",
		PERMISSION_DENIED: "perm",
		VERSION_INCOMPATIBLE: "version",
	},
}));

vi.mock("../../src/utils/config-manager", () => ({
	ConfigManager: {
		getInstance: vi.fn().mockReturnValue({
			loadSettings: vi.fn(),
			getSettings: vi.fn().mockReturnValue({}),
		}),
	},
}));

const stubChannel: Mocked<vscode.OutputChannel> = {
	name: "test",
	append: vi.fn(),
	appendLine: vi.fn(),
	clear: vi.fn(),
	dispose: vi.fn(),
	hide: vi.fn(),
	replace: vi.fn(),
	show: vi.fn(),
} as unknown as Mocked<vscode.OutputChannel>;

const stubContext: Mocked<vscode.ExtensionContext> = {
	globalStorageUri: { fsPath: "/tmp" } as vscode.Uri,
} as Mocked<vscode.ExtensionContext>;

Object.defineProperty(vscode, "workspace", {
	value: {
		workspaceFolders: [{ uri: { fsPath: "/workspace" } }],
		getConfiguration: vi.fn().mockReturnValue({
			get: (key: string, fallback: unknown) => {
				const values: Record<string, unknown> = {
					"codex.path": "codex",
					"codex.defaultApprovalMode": ApprovalMode.Interactive,
					"codex.defaultModel": "gpt-5",
					"codex.timeout": 30000,
					"codex.terminalDelay": 1000,
				};
				return values[key] ?? fallback;
			},
		}),
		fs: {
			createDirectory: vi.fn(),
			writeFile: vi.fn(),
			stat: vi.fn(),
		},
		onDidChangeConfiguration: vi.fn(),
	},
	configurable: true,
});

Object.defineProperty(vscode, "window", {
	value: {
		visibleTextEditors: [{}],
	},
	configurable: true,
});

Object.defineProperty(vscode, "env", {
	value: { shell: undefined },
	configurable: true,
});

beforeEach(() => {
	recordedTerminals.length = 0;
	recordedExecCalls.length = 0;
	processManagerInstances.length = 0;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("CodexProvider integration", () => {
	it("pipes prompt via stdin when executing Codex", async () => {
		const provider = new CodexProvider(stubContext, stubChannel);
		await provider.executeCodex("print('hello world')", {
			model: "gpt-4",
		});
		const processManager = processManagerInstances[0];
		const execCall = (processManager.executeCommandArgs as Mock).mock.calls[0];
		expect(execCall[0]).toBe("codex");
		expect(execCall[1]).toEqual([
			"exec",
			"--sandbox",
			"read-only",
			"--ask-for-approval",
			"never",
			"-m",
			"gpt-4",
			"-",
		]);
		expect(execCall[2]).toMatchObject({ input: "print('hello world')" });
	});

	it("constructs POSIX pipeline for terminal invocation", async () => {
		const provider = new CodexProvider(stubContext, stubChannel);
		const platformSpy = vi
			.spyOn(process, "platform", "get")
			.mockReturnValue("linux");

		await provider.invokeCodexSplitView("echo hi", "Test");

		expect(recordedTerminals[0]).toContain("cat");
		expect(recordedTerminals[0]).toMatch(
			/'codex'\s+'exec'\s+'--sandbox'\s+'read-only'\s+'--ask-for-approval'\s+'never'/,
		);
		expect(recordedTerminals[0]).toMatch(
			/'codex'\s+resume\s+--last\s+'--sandbox'\s+'read-only'\s+'--ask-for-approval'\s+'never'/,
		);

		platformSpy.mockRestore();
	});

	it("constructs PowerShell pipeline on Windows", async () => {
		const provider = new CodexProvider(stubContext, stubChannel);
		const platformSpy = vi
			.spyOn(process, "platform", "get")
			.mockReturnValue("win32");

		await provider.invokeCodexSplitView("Write-Output hi", "Test");

		expect(recordedTerminals[0]).toContain("Get-Content -Raw -Encoding UTF8");
		expect(recordedTerminals[0]).toMatch(
			/''codex''\s+''exec''\s+''--sandbox''\s+''read-only''\s+''--ask-for-approval''\s+''never''/,
		);
		expect(recordedTerminals[0]).toMatch(
			/''codex''\s+resume\s+--last\s+''--sandbox''\s+''read-only''\s+''--ask-for-approval''\s+''never''/,
		);

		platformSpy.mockRestore();
	});
});
