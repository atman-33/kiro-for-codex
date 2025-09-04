import * as vscode from 'vscode';
import * as path from 'path';
import { AgentManager, AgentInfo } from '../features/agents/agentManager';

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
            const projectAgentsPattern = new vscode.RelativePattern(
                workspaceFolder,
                '.claude/agents/**/*.md'
            );

            this.fileWatcher = vscode.workspace.createFileSystemWatcher(projectAgentsPattern);

            // File watcher changes should refresh without loading animation
            this.fileWatcher.onDidCreate(() => this._onDidChangeTreeData.fire());
            this.fileWatcher.onDidChange(() => this._onDidChangeTreeData.fire());
            this.fileWatcher.onDidDelete(() => this._onDidChangeTreeData.fire());
        }

        // Watch user agents directory (including subdirectories)
        const userAgentsPath = path.join(require('os').homedir(), '.claude/agents');
        const userAgentsPattern = new vscode.RelativePattern(
            userAgentsPath,
            '**/*.md'
        );

        try {
            this.userFileWatcher = vscode.workspace.createFileSystemWatcher(userAgentsPattern);

            // File watcher changes should refresh without loading animation
            this.userFileWatcher.onDidCreate(() => this._onDidChangeTreeData.fire());
            this.userFileWatcher.onDidChange(() => this._onDidChangeTreeData.fire());
            this.userFileWatcher.onDidDelete(() => this._onDidChangeTreeData.fire());
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