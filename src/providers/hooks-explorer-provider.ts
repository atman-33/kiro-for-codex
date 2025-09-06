import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class HooksExplorerProvider implements vscode.TreeDataProvider<HookItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HookItem | undefined | null | void> = new vscode.EventEmitter<HookItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HookItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private isLoading: boolean = false;

    constructor(private context: vscode.ExtensionContext) {
        // Start with loading state
        this.isLoading = true;
        this.loadHooks().then(() => {
            this.isLoading = false;
            this._onDidChangeTreeData.fire();
        });
    }

    refresh(): void {
        this.isLoading = true;
        this._onDidChangeTreeData.fire(); // Fire immediately to show loading state
        this.loadHooks().then(() => {
            this.isLoading = false;
            this._onDidChangeTreeData.fire(); // Fire again to show the loaded hooks
        });
    }

    private async loadHooks(): Promise<void> {
        // Simulate async loading (reading files is actually quite fast)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    getTreeItem(element: HookItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: HookItem): Promise<HookItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            return [];
        }

        if (!element) {
            // Show loading state
            if (this.isLoading) {
                return [
                    new HookItem(
                        'Loading agent hooks...',
                        vscode.TreeItemCollapsibleState.None,
                        'loading',
                        'loading',
                        undefined,
                        this.context
                    )
                ];
            }

            // Show Codex hooks directly at root level
            const hooks = await this.getCodexHooks();
            if (hooks.length === 0) {
                return [
                    new HookItem(
                        'No Codex hooks configured',
                        vscode.TreeItemCollapsibleState.None,
                        'no-hooks',
                        'no-hooks',
                        undefined,
                        this.context
                    )
                ];
            }

            return hooks.map(hook => new HookItem(
                hook.name,
                vscode.TreeItemCollapsibleState.Collapsed,
                'hook',
                `codex-hook-${hook.name}`,
                undefined, // Remove command to allow default expand/collapse on click
                this.context,
                hook.enabled,
                hook.config,
                hook.configPath // Save configPath for later use
            ));
        } else if (element.contextValue === 'hook' && element.hookConfig) {
            // Show hook details as children
            const config = element.hookConfig;
            const items: HookItem[] = [];

            // Show each trigger configuration
            if (Array.isArray(config)) {
                config.forEach((trigger, index) => {
                    items.push(new HookItem(
                        `Trigger ${index + 1}`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'hook-trigger',
                        `trigger-${element.id}-${index}`,
                        element.configPath ? {
                            command: 'vscode.open',
                            title: 'Open Configuration File',
                            arguments: [vscode.Uri.file(element.configPath)]
                        } : undefined,
                        this.context,
                        undefined,
                        trigger
                    ));
                });
            }

            return items;
        } else if (element.contextValue === 'hook-trigger' && element.hookConfig) {
            // Show trigger details
            const trigger = element.hookConfig;
            const items: HookItem[] = [];

            if (trigger.matcher !== undefined) {
                items.push(new HookItem(
                    `Matcher: ${trigger.matcher || '(empty)'}`,
                    vscode.TreeItemCollapsibleState.None,
                    'hook-detail',
                    `${element.id}-matcher`,
                    element.command, // Keep parent's command (open config)
                    this.context
                ));
            }

            if (trigger.hooks && Array.isArray(trigger.hooks)) {
                trigger.hooks.forEach((hook: any, index: number) => {
                    if (hook.type === 'command') {
                        items.push(new HookItem(
                            `Command: ${hook.command}`,
                            vscode.TreeItemCollapsibleState.None,
                            'hook-command', // Use specific contextValue
                            `${element.id}-command-${index}`,
                            {
                                command: 'kfc.hooks.copyCommand',
                                title: 'Copy Command',
                                arguments: [hook.command]
                            },
                            this.context
                        ));
                    }
                });
            }

            return items;
        }

        return [];
    }

    private async getCodexHooks(): Promise<{ name: string, enabled: boolean, config: any, configPath: string; }[]> {
        const hooks: { name: string, enabled: boolean, config: any, configPath: string; }[] = [];

        // Check workspace .codex/settings.json first
        if (vscode.workspace.workspaceFolders) {
            const workspaceConfigPath = path.join(
                vscode.workspace.workspaceFolders[0].uri.fsPath,
                '.codex',
                'settings.json'
            );
            if (fs.existsSync(workspaceConfigPath)) {
                try {
                    const config = JSON.parse(fs.readFileSync(workspaceConfigPath, 'utf8'));
                    if (config.hooks) {
                        Object.entries(config.hooks).forEach(([name, value]) => {
                            hooks.push({
                                name,
                                enabled: true,
                                config: value,
                                configPath: workspaceConfigPath
                            });
                        });
                    }
                } catch (error) {
                    console.error('Failed to read workspace Codex hooks:', error);
                }
            }
        }

        // Then check global ~/.codex/settings.json
        try {
            const codexConfigPath = path.join(process.env.HOME || '', '.codex', 'settings.json');
            if (fs.existsSync(codexConfigPath)) {
                const config = JSON.parse(fs.readFileSync(codexConfigPath, 'utf8'));
                if (config.hooks) {
                    Object.entries(config.hooks).forEach(([name, value]) => {
                        // Only add if not already added from workspace
                        if (!hooks.find(h => h.name === name)) {
                            hooks.push({
                                name,
                                enabled: true,
                                config: value,
                                configPath: codexConfigPath
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to read global Codex hooks:', error);
        }
        return hooks;
    }
}

class HookItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly id: string,
        public readonly command?: vscode.Command,
        private readonly context?: vscode.ExtensionContext,
        public readonly enabled?: boolean,
        public readonly hookConfig?: any,
        public readonly configPath?: string
    ) {
        super(label, collapsibleState);

        // Set appropriate icons
        if (contextValue === 'loading') {
            this.iconPath = new vscode.ThemeIcon('sync~spin');
        } else if (contextValue === 'no-hooks') {
            this.iconPath = new vscode.ThemeIcon('info');
        } else if (contextValue === 'hook') {
            this.iconPath = new vscode.ThemeIcon('activate-breakpoints');
        } else if (contextValue === 'hook-trigger') {
            this.iconPath = new vscode.ThemeIcon('run');
        } else if (contextValue === 'hook-detail') {
            if (label.startsWith('Matcher:')) {
                this.iconPath = new vscode.ThemeIcon('filter');
            } else if (label.startsWith('Command:')) {
                this.iconPath = new vscode.ThemeIcon('terminal');
            } else {
                this.iconPath = new vscode.ThemeIcon('circle-outline');
            }
        } else if (contextValue === 'hook-command') {
            this.iconPath = new vscode.ThemeIcon('terminal');
        } else if (context) {
            this.iconPath = {
                light: vscode.Uri.file(context.asAbsolutePath('icons/zap.svg')),
                dark: vscode.Uri.file(context.asAbsolutePath('icons/zap.svg'))
            };
        } else {
            this.iconPath = new vscode.ThemeIcon('activate-breakpoints');
        }

        // No need to show Active/Inactive, as all hooks in config file are active

        // Set tooltips
        if (contextValue === 'no-hooks') {
            this.tooltip = 'Configure hooks in Codex CLI';
        } else if (contextValue === 'hook-detail' && label.startsWith('Command:')) {
            this.tooltip = label.substring(9); // Show full command in tooltip
        } else {
            this.tooltip = label;
        }
    }
}
