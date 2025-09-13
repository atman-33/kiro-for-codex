import * as path from "path";
import * as vscode from "vscode";
import { CONFIG_FILE_NAME, DEFAULT_PATHS } from "../constants";

// Minimal project-local settings persisted under .codex/settings/kfc-settings.json
// Only "paths" are honored by the extension. Other runtime configs live in VS Code settings (kfc.*).
export interface KfcSettings {
	paths: {
		specs: string;
		steering: string;
		settings: string;
		prompts: string;
	};
}

export class ConfigManager {
	private static instance: ConfigManager;
	private settings: KfcSettings | null = null;
	private workspaceFolder: vscode.WorkspaceFolder | undefined;

	// Internal constants
	private static readonly TERMINAL_VENV_ACTIVATION_DELAY = 800; // ms

	private constructor() {
		this.workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	}

	static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	async loadSettings(): Promise<KfcSettings> {
		if (!this.workspaceFolder) {
			return this.getDefaultSettings();
		}

		const settingsPath = path.join(
			this.workspaceFolder.uri.fsPath,
			DEFAULT_PATHS.settings,
			CONFIG_FILE_NAME,
		);

		try {
			const fileContent = await vscode.workspace.fs.readFile(
				vscode.Uri.file(settingsPath),
			);
			const settings = JSON.parse(Buffer.from(fileContent).toString());
			const mergedSettings = { ...this.getDefaultSettings(), ...settings };
			this.settings = mergedSettings;
			return this.settings!;
		} catch (error) {
			// Return default settings if file doesn't exist
			this.settings = this.getDefaultSettings();
			return this.settings!;
		}
	}

	getSettings(): KfcSettings {
		if (!this.settings) {
			this.settings = this.getDefaultSettings();
		}
		return this.settings;
	}

	getPath(type: keyof typeof DEFAULT_PATHS): string {
		const settings = this.getSettings();
		return settings.paths[type] || DEFAULT_PATHS[type];
	}

	getAbsolutePath(type: keyof typeof DEFAULT_PATHS): string {
		if (!this.workspaceFolder) {
			throw new Error("No workspace folder found");
		}
		return path.join(this.workspaceFolder.uri.fsPath, this.getPath(type));
	}

	getTerminalDelay(): number {
		return ConfigManager.TERMINAL_VENV_ACTIVATION_DELAY;
	}

	private getDefaultSettings(): KfcSettings {
		return {
			paths: { ...DEFAULT_PATHS },
		};
	}

	async saveSettings(settings: KfcSettings): Promise<void> {
		if (!this.workspaceFolder) {
			throw new Error("No workspace folder found");
		}

		const settingsDir = path.join(
			this.workspaceFolder.uri.fsPath,
			DEFAULT_PATHS.settings,
		);
		const settingsPath = path.join(settingsDir, CONFIG_FILE_NAME);

		// Ensure directory exists
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(settingsDir));

		// Save settings
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(settingsPath),
			Buffer.from(JSON.stringify(settings, null, 2)),
		);

		this.settings = settings;
	}

	// (Intentionally minimal) — legacy config sections (views/codex/migration) have been removed.
}
