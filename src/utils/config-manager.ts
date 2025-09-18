import * as path from "path";
import * as vscode from "vscode";
import { CONFIG_FILE_NAME, DEFAULT_PATHS, SETTINGS_DIR } from "../constants";

// Minimal project-local settings persisted under .codex/settings/kiroCodex-settings.json
// Only "paths" are honored by the extension. Other runtime configs live in VS Code settings (kiroCodex.*).
export interface KiroCodexSettings {
	paths: {
		specs: string;
		steering: string;
	};
}

export class ConfigManager {
	private static instance: ConfigManager;
	private settings: KiroCodexSettings | null = null;
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

	async loadSettings(): Promise<KiroCodexSettings> {
		if (!this.workspaceFolder) {
			return this.getDefaultSettings();
		}

		const settingsPath = path.join(
			this.workspaceFolder.uri.fsPath,
			SETTINGS_DIR,
			CONFIG_FILE_NAME,
		);

		try {
			const fileContent = await vscode.workspace.fs.readFile(
				vscode.Uri.file(settingsPath),
			);
			const parsed = JSON.parse(Buffer.from(fileContent).toString());
			const mergedSettings = this.mergeWithDefaults(parsed);
			this.settings = mergedSettings;
			return this.settings!;
		} catch (error) {
			// Return default settings if file doesn't exist
			this.settings = this.getDefaultSettings();
			return this.settings!;
		}
	}

	getSettings(): KiroCodexSettings {
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

	private getDefaultSettings(): KiroCodexSettings {
		return {
			paths: {
				specs: DEFAULT_PATHS.specs,
				steering: DEFAULT_PATHS.steering,
			},
		};
	}

	private mergeWithDefaults(settings: any): KiroCodexSettings {
		const defaults = this.getDefaultSettings();
		const incomingPaths = settings?.paths ?? {};
		return {
			paths: {
				specs: incomingPaths.specs || defaults.paths.specs,
				steering: incomingPaths.steering || defaults.paths.steering,
			},
		};
	}

	async saveSettings(settings: KiroCodexSettings): Promise<void> {
		if (!this.workspaceFolder) {
			throw new Error("No workspace folder found");
		}

		const settingsDir = path.join(
			this.workspaceFolder.uri.fsPath,
			SETTINGS_DIR,
		);
		const settingsPath = path.join(settingsDir, CONFIG_FILE_NAME);

		// Ensure directory exists
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(settingsDir));

		// Save settings
		const sanitized = this.mergeWithDefaults(settings);

		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(settingsPath),
			Buffer.from(JSON.stringify(sanitized, null, 2)),
		);

		this.settings = sanitized;
	}

	// (Intentionally minimal) — legacy config sections (views/codex/migration) have been removed.
}
