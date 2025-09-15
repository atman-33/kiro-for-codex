import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import { workspace } from "vscode";
import {
	ConfigManager,
	type KiroCodexSettings,
} from "../../../src/utils/config-manager";

// Mock vscode
vi.mock("vscode", () => ({
	workspace: {
		workspaceFolders: [
			{
				uri: { fsPath: "/test/workspace" },
			},
		],
		fs: {
			createDirectory: vi.fn().mockResolvedValue(undefined),
			writeFile: vi.fn().mockResolvedValue(undefined),
			readFile: vi.fn().mockResolvedValue(Buffer.from("{}")),
		},
		getConfiguration: vi.fn(() => ({ get: vi.fn() })),
	},
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path })),
	},
}));

describe("ConfigManager (paths-only settings)", () => {
	let configManager: ConfigManager;

	beforeEach(() => {
		vi.clearAllMocks();
		configManager = ConfigManager.getInstance();
	});

	test("returns default paths when file missing", async () => {
		// Simulate file not found
		(workspace.fs.readFile as Mock).mockRejectedValueOnce(new Error("ENOENT"));

		const settings = await configManager.loadSettings();

		expect(settings.paths).toEqual({
			specs: ".codex/specs",
			steering: ".codex/steering",
			settings: ".codex/settings",
			prompts: ".codex/prompts",
		});
	});

	test("merges paths from existing file", async () => {
		const fileContent: KiroCodexSettings = {
			paths: {
				specs: "custom/specs",
				steering: ".codex/steering",
				settings: ".codex/settings",
				prompts: ".codex/prompts",
			},
		};
		(workspace.fs.readFile as Mock).mockResolvedValueOnce(
			Buffer.from(JSON.stringify(fileContent)),
		);

		const settings = await configManager.loadSettings();
		expect(settings.paths.specs).toBe("custom/specs");
		// Unchanged keys fallback to defaults via merge
		expect(settings.paths.prompts).toBe(".codex/prompts");
	});

	test("getPath returns overridden or default value", async () => {
		// Reset to defaults for this test
		(workspace.fs.readFile as Mock).mockResolvedValueOnce(Buffer.from("{}"));
		await configManager.loadSettings();

		const specs = configManager.getPath("specs");
		const prompts = configManager.getPath("prompts");
		expect(specs).toBe(".codex/specs");
		expect(prompts).toBe(".codex/prompts");
	});

	test("saveSettings writes only paths object", async () => {
		const newSettings: KiroCodexSettings = {
			paths: {
				specs: "s",
				steering: "t",
				settings: "u",
				prompts: "v",
			},
		};

		await configManager.saveSettings(newSettings);

		expect(workspace.fs.writeFile).toHaveBeenCalled();
		const [, content] = (workspace.fs.writeFile as Mock).mock.calls[0];
		const saved = JSON.parse(Buffer.from(content).toString());
		expect(Object.keys(saved)).toEqual(["paths"]);
		expect(saved.paths).toEqual(newSettings.paths);
	});

	test("getAbsolutePath builds from workspace root", async () => {
		// Reset to defaults for this test
		(workspace.fs.readFile as Mock).mockResolvedValueOnce(Buffer.from("{}"));
		await configManager.loadSettings();

		const abs = configManager.getAbsolutePath("prompts");
		expect(abs).toBe("/test/workspace/.codex/prompts");
	});
});
