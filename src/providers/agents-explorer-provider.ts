import * as path from 'path';
import * as vscode from 'vscode';
import { AgentInfo, AgentManager } from '../features/agents/agent-manager';

export class AgentsExplorerProvider implements vscode.TreeDataProvider<AgentItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AgentItem | undefined | null | void> = new vscode.EventEmitter<AgentItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AgentItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private userFileWatcher: vscode.FileSystemWatcher | undefined;
    private isLoading: boolean = false;

    constructor(
        private context: vscode.ExtensionContext,
        private agentManager: AgentManager,
        private outputChannel: vscode.OutputChannel
    ) {
        this.setupFileWatchers();
    }

    refresh(): void {
        this.isLoading = true;
        this._onDidChangeTreeData.fire(); // Show loading state immediately

        // Simulate async loading
        setTimeout(() => {
            this.isLoading = false;
            this._onDidChangeTreeData.fire(); // Show actual content
        }, 100);
    }

    getTreeItem(element: AgentItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: AgentItem): Promise<AgentItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            return [];
        }

        if (!element) {
            // Root level - show loading state or agent groups
            const items: AgentItem[] = [];

            if (this.isLoading) {
                // Show loading state
                items.push(new AgentItem(
                    'Loading agents...',
                    vscode.TreeItemCollapsibleState.None,
                    'agent-loading'
                ));
                return items;
            }

            // User agents group - always show it (first)
            items.push(new AgentItem(
                'User Agents',
                vscode.TreeItemCollapsibleState.Expanded,
                'agent-group',
                'user'
            ));

            // Project agents group
            const projectAgents = await this.agentManager.getAgentList('project');
            if (projectAgents.length > 0 || vscode.workspace.workspaceFolders) {
                items.push(new AgentItem(
                    'Project Agents',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'agent-group',
                    'project'
                ));
            }

            return items;
        } else if (element.contextValue === 'agent-group') {
            // Show agents under the group
            const agents = await this.agentManager.getAgentList(element.groupType as 'project' | 'user');
            return agents.map(agent => new AgentItem(
                agent.name,
                vscode.TreeItemCollapsibleState.None,
                'agent',
                undefined,
                agent
            ));
        }

        return [];
    }

    private setupFileWatchers(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        // Watch project agents directory
        if (workspaceFolder) {
            const codexAgentsPattern = new vscode.RelativePattern(
                workspaceFolder,
                '.codex/agents/**/*.md'
            );

            this.fileWatcher = vscode.workspace.createFileSystemWatcher(codexAgentsPattern);
            const codexWatcher = vscode.workspace.createFileSystemWatcher(codexAgentsPattern);

            // File watcher changes should refresh without loading animation
            this.fileWatcher.onDidCreate(() => this._onDidChangeTreeData.fire());
            this.fileWatcher.onDidChange(() => this._onDidChangeTreeData.fire());
            this.fileWatcher.onDidDelete(() => this._onDidChangeTreeData.fire());

            codexWatcher.onDidCreate(() => this._onDidChangeTreeData.fire());
            codexWatcher.onDidChange(() => this._onDidChangeTreeData.fire());
            codexWatcher.onDidDelete(() => this._onDidChangeTreeData.fire());

            // Store both watchers for disposal
            this.context.subscriptions.push(codexWatcher);
        }

        // Watch user agents directory (including subdirectories)
        const userCodexAgentsPath = path.join(require('os').homedir(), '.codex/agents');

        const userCodexAgentsPattern = new vscode.RelativePattern(
            userCodexAgentsPath,
            '**/*.md'
        );

        try {
            this.userFileWatcher = vscode.workspace.createFileSystemWatcher(userCodexAgentsPattern);
            const userCodexWatcher = vscode.workspace.createFileSystemWatcher(userCodexAgentsPattern);

            // File watcher changes should refresh without loading animation
            this.userFileWatcher.onDidCreate(() => this._onDidChangeTreeData.fire());
            this.userFileWatcher.onDidChange(() => this._onDidChangeTreeData.fire());
            this.userFileWatcher.onDidDelete(() => this._onDidChangeTreeData.fire());

            userCodexWatcher.onDidCreate(() => this._onDidChangeTreeData.fire());
            userCodexWatcher.onDidChange(() => this._onDidChangeTreeData.fire());
            userCodexWatcher.onDidDelete(() => this._onDidChangeTreeData.fire());

            // Store both watchers for disposal
            this.context.subscriptions.push(userCodexWatcher);
        } catch (error) {
            this.outputChannel.appendLine(`[AgentsExplorer] Failed to watch user agents directory: ${error}`);
        }
    }

    dispose(): void {
        this.fileWatcher?.dispose();
        this.userFileWatcher?.dispose();
    }
}

class AgentItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly groupType?: string,
        public readonly agentInfo?: AgentInfo
    ) {
        super(label, collapsibleState);

        if (contextValue === 'agent-loading') {
            // Loading state with spinning icon
            this.iconPath = new vscode.ThemeIcon('sync~spin');
            this.tooltip = 'Loading agents...';
        } else if (contextValue === 'agent-group') {
            // Use icons similar to Steering Explorer
            if (groupType === 'user') {
                this.iconPath = new vscode.ThemeIcon('globe');
                this.tooltip = 'User-wide agents available across all projects';
            } else {
                this.iconPath = new vscode.ThemeIcon('root-folder');
                this.tooltip = 'Project-specific agents';
            }
        } else if (contextValue === 'agent' && agentInfo) {
            this.iconPath = new vscode.ThemeIcon('robot');
            this.tooltip = agentInfo.description || agentInfo.name;
            this.description = agentInfo.tools ? `Tools: ${agentInfo.tools.length}` : undefined;

            // Add command to open agent file
            this.command = {
                command: 'vscode.open',
                title: 'Open Agent',
                arguments: [vscode.Uri.file(agentInfo.path)]
            };
        }
    }
}
