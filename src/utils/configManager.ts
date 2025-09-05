import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CONFIG_FILE_NAME, DEFAULT_PATHS, DEFAULT_VIEW_VISIBILITY } from '../constants';

export enum ApprovalMode {
    Interactive = 'interactive',
    AutoEdit = 'auto-edit',
    FullAuto = 'full-auto'
}

export interface CodexConfig {
    path: string;
    defaultApprovalMode: ApprovalMode;
    defaultModel?: string;
    timeout: number;
    terminalDelay: number;
}

export interface MigrationConfig {
    preserveClaudeSettings: boolean;
    backupOriginalFiles: boolean;
    migrationCompleted: boolean;
}

export interface KfcSettings {
    paths: {
        specs: string;
        steering: string;
        settings: string;
    };
    views: {
        specs: { visible: boolean; };
        steering: { visible: boolean; };
        mcp: { visible: boolean; };
        hooks: { visible: boolean; };
        settings: { visible: boolean; };
    };
    codex?: CodexConfig;
    migration?: MigrationConfig;
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
            CONFIG_FILE_NAME
        );

        try {
            const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(settingsPath));
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
            throw new Error('No workspace folder found');
        }
        return path.join(this.workspaceFolder.uri.fsPath, this.getPath(type));
    }

    getTerminalDelay(): number {
        return ConfigManager.TERMINAL_VENV_ACTIVATION_DELAY;
    }

    private getDefaultSettings(): KfcSettings {
        return {
            paths: { ...DEFAULT_PATHS },
            views: {
                specs: { visible: DEFAULT_VIEW_VISIBILITY.specs },
                steering: { visible: DEFAULT_VIEW_VISIBILITY.steering },
                mcp: { visible: DEFAULT_VIEW_VISIBILITY.mcp },
                hooks: { visible: DEFAULT_VIEW_VISIBILITY.hooks },
                settings: { visible: DEFAULT_VIEW_VISIBILITY.settings }
            },
            codex: this.getDefaultCodexConfig(),
            migration: this.getDefaultMigrationConfig()
        };
    }

    private getDefaultCodexConfig(): CodexConfig {
        return {
            path: 'codex',
            defaultApprovalMode: ApprovalMode.Interactive,
            defaultModel: 'gpt-5',
            timeout: 30000,
            terminalDelay: 1000
        };
    }

    private getDefaultMigrationConfig(): MigrationConfig {
        return {
            preserveClaudeSettings: true,
            backupOriginalFiles: true,
            migrationCompleted: false
        };
    }

    async saveSettings(settings: KfcSettings): Promise<void> {
        if (!this.workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        const settingsDir = path.join(
            this.workspaceFolder.uri.fsPath,
            DEFAULT_PATHS.settings
        );
        const settingsPath = path.join(settingsDir, CONFIG_FILE_NAME);

        // Ensure directory exists
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(settingsDir));

        // Save settings
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(settingsPath),
            Buffer.from(JSON.stringify(settings, null, 2))
        );

        this.settings = settings;
    }

    // Codex Configuration Methods
    getCodexConfig(): CodexConfig {
        const settings = this.getSettings();
        return settings.codex || this.getDefaultCodexConfig();
    }

    async updateCodexConfig(config: Partial<CodexConfig>): Promise<void> {
        const settings = this.getSettings();
        settings.codex = { ...this.getCodexConfig(), ...config };
        await this.saveSettings(settings);
    }

    async validateCodexPath(codexPath?: string): Promise<{ isValid: boolean; error?: string; }> {
        const pathToCheck = codexPath || this.getCodexConfig().path;

        try {
            // Check if codex command is available
            const { spawn } = require('child_process');

            return new Promise((resolve) => {
                const process = spawn(pathToCheck, ['--version'], {
                    stdio: 'pipe',
                    timeout: 5000
                });

                let output = '';
                process.stdout?.on('data', (data: Buffer) => {
                    output += data.toString();
                });

                process.on('close', (code: number) => {
                    if (code === 0) {
                        resolve({ isValid: true });
                    } else {
                        resolve({
                            isValid: false,
                            error: `Codex CLI returned exit code ${code}`
                        });
                    }
                });

                process.on('error', (error: Error) => {
                    resolve({
                        isValid: false,
                        error: `Failed to execute Codex CLI: ${error.message}`
                    });
                });
            });
        } catch (error) {
            return {
                isValid: false,
                error: `Error validating Codex path: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    // Migration Methods
    getMigrationConfig(): MigrationConfig {
        const settings = this.getSettings();
        return settings.migration || this.getDefaultMigrationConfig();
    }

    async updateMigrationConfig(config: Partial<MigrationConfig>): Promise<void> {
        const settings = this.getSettings();
        settings.migration = { ...this.getMigrationConfig(), ...config };
        await this.saveSettings(settings);
    }

    async migrateFromClaudeCode(): Promise<{ success: boolean; backupPath?: string; error?: string; }> {
        try {
            const migrationConfig = this.getMigrationConfig();

            if (migrationConfig.migrationCompleted) {
                return { success: true };
            }

            let backupPath: string | undefined;

            // Create backup if requested
            if (migrationConfig.backupOriginalFiles) {
                backupPath = await this.createClaudeCodeBackup();
            }

            // Migrate Claude Code specific settings
            await this.migrateClaudeCodeSettings();

            // Mark migration as completed
            await this.updateMigrationConfig({ migrationCompleted: true });

            return { success: true, backupPath };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown migration error'
            };
        }
    }

    private async createClaudeCodeBackup(): Promise<string> {
        if (!this.workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(
            this.workspaceFolder.uri.fsPath,
            DEFAULT_PATHS.settings,
            `claude-code-backup-${timestamp}`
        );

        // Create backup directory
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(backupDir));

        // Copy current settings file if it exists
        const currentSettingsPath = path.join(
            this.workspaceFolder.uri.fsPath,
            DEFAULT_PATHS.settings,
            CONFIG_FILE_NAME
        );

        if (fs.existsSync(currentSettingsPath)) {
            const backupSettingsPath = path.join(backupDir, CONFIG_FILE_NAME);
            await fs.promises.copyFile(currentSettingsPath, backupSettingsPath);
        }

        return backupDir;
    }

    private async migrateClaudeCodeSettings(): Promise<void> {
        const migrationConfig = this.getMigrationConfig();

        if (!migrationConfig.preserveClaudeSettings) {
            return;
        }

        // Get current settings
        const settings = this.getSettings();

        // Migrate terminal delay from Claude Code if it exists
        // This would typically come from VSCode settings or existing config
        const vscodeConfig = vscode.workspace.getConfiguration();
        const existingDelay = vscodeConfig.get<number>('kfc.terminalDelay');

        if (existingDelay && settings.codex) {
            settings.codex.terminalDelay = existingDelay;
        }

        // Preserve existing paths and views
        // These are already handled by the default settings merge

        await this.saveSettings(settings);
    }

    // Approval Mode Management
    async setApprovalMode(mode: ApprovalMode): Promise<void> {
        await this.updateCodexConfig({ defaultApprovalMode: mode });
    }

    getApprovalMode(): ApprovalMode {
        return this.getCodexConfig().defaultApprovalMode;
    }

    // Codex CLI Availability Check
    async checkCodexAvailability(): Promise<{ available: boolean; version?: string; error?: string; }> {
        const validation = await this.validateCodexPath();

        if (!validation.isValid) {
            return {
                available: false,
                error: validation.error
            };
        }

        try {
            const codexPath = this.getCodexConfig().path;
            const { spawn } = require('child_process');

            return new Promise((resolve) => {
                const process = spawn(codexPath, ['--version'], {
                    stdio: 'pipe',
                    timeout: 5000
                });

                let output = '';
                process.stdout?.on('data', (data: Buffer) => {
                    output += data.toString();
                });

                process.on('close', (code: number) => {
                    if (code === 0) {
                        // Extract version from output
                        const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
                        const version = versionMatch ? versionMatch[1] : 'unknown';
                        resolve({ available: true, version });
                    } else {
                        resolve({
                            available: false,
                            error: `Codex CLI returned exit code ${code}`
                        });
                    }
                });

                process.on('error', (error: Error) => {
                    resolve({
                        available: false,
                        error: `Failed to check Codex version: ${error.message}`
                    });
                });
            });
        } catch (error) {
            return {
                available: false,
                error: `Error checking Codex availability: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}