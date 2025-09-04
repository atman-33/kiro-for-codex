import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SteeringManager } from '../features/steering/steeringManager';

export class SteeringExplorerProvider implements vscode.TreeDataProvider<SteeringItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SteeringItem | undefined | null | void> = new vscode.EventEmitter<SteeringItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SteeringItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private steeringManager!: SteeringManager;
    private isLoading: boolean = false;

    constructor(private context: vscode.ExtensionContext) {
        // We'll set the steering manager later from extension.ts
    }

    setSteeringManager(steeringManager: SteeringManager) {
        this.steeringManager = steeringManager;
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

    getTreeItem(element: SteeringItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SteeringItem): Promise<SteeringItem[]> {
        if (!element) {
            // Root level - show loading state or CLAUDE.md files
            const items: SteeringItem[] = [];

            if (this.isLoading) {
                // Show loading state
                items.push(new SteeringItem(
                    'Loading steering documents...',
                    vscode.TreeItemCollapsibleState.None,
                    'steering-loading',
                    '',  // resourcePath
                    this.context
                ));
                return items;
            }

            // Check existence of files
            const globalClaudeMd = path.join(process.env.HOME || '', '.claude', 'CLAUDE.md');
            const globalExists = fs.existsSync(globalClaudeMd);

            let projectClaudeMd = '';
            let projectExists = false;
            if (vscode.workspace.workspaceFolders) {
                projectClaudeMd = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'CLAUDE.md');
                projectExists = fs.existsSync(projectClaudeMd);
            }

            // Always show Global Rule and Project Rule (if they exist)
            if (globalExists) {
                items.push(new SteeringItem(
                    'Global Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'claude-md-global',
                    globalClaudeMd,
                    this.context,
                    {
                        command: 'vscode.open',
                        title: 'Open Global CLAUDE.md',
                        arguments: [vscode.Uri.file(globalClaudeMd)]
                    }
                ));
            }

            if (projectExists) {
                items.push(new SteeringItem(
                    'Project Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'claude-md-project',
                    projectClaudeMd,
                    this.context,
                    {
                        command: 'vscode.open',
                        title: 'Open Project CLAUDE.md',
                        arguments: [vscode.Uri.file(projectClaudeMd)]
                    }
                ));
            }

            // Traditional steering documents - add them directly at root level if they exist
            if (vscode.workspace.workspaceFolders && this.steeringManager) {
                const steeringDocs = await this.steeringManager.getSteeringDocuments();
                if (steeringDocs.length > 0) {
                    // Add a collapsible header item for steering documents
                    items.push(new SteeringItem(
                        'Steering Docs',
                        vscode.TreeItemCollapsibleState.Expanded, // Make it expandable
                        'steering-header',
                        '',
                        this.context
                    ));
                }
            }

            // Add create buttons at the bottom for missing files
            if (!globalExists) {
                items.push(new SteeringItem(
                    'Create Global Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'create-global-claude',
                    '',
                    this.context,
                    {
                        command: 'kfc.steering.createUserRule',
                        title: 'Create Global CLAUDE.md'
                    }
                ));
            }

            if (vscode.workspace.workspaceFolders && !projectExists) {
                items.push(new SteeringItem(
                    'Create Project Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'create-project-claude',
                    '',
                    this.context,
                    {
                        command: 'kfc.steering.createProjectRule',
                        title: 'Create Project CLAUDE.md'
                    }
                ));
            }

            return items;
        } else if (element.contextValue === 'steering-header') {
            // Return steering documents as children of the header
            const items: SteeringItem[] = [];

            if (vscode.workspace.workspaceFolders && this.steeringManager) {
                const steeringDocs = await this.steeringManager.getSteeringDocuments();
                const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;

                for (const doc of steeringDocs) {
                    // Calculate relative path from workspace root
                    const relativePath = path.relative(workspacePath, doc.path);
                    items.push(new SteeringItem(
                        doc.name,
                        vscode.TreeItemCollapsibleState.None,
                        'steering-document',
                        doc.path,
                        this.context,
                        {
                            command: 'vscode.open',
                            title: 'Open Steering Document',
                            arguments: [vscode.Uri.file(doc.path)]
                        },
                        relativePath // Pass relative path without prefix
                    ));
                }
            }

            return items;
        }

        return [];
    }
}

class SteeringItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly resourcePath: string,
        private readonly context: vscode.ExtensionContext,
        public readonly command?: vscode.Command,
        private readonly filename?: string
    ) {
        super(label, collapsibleState);

        // Set appropriate icons based on type
        if (contextValue === 'steering-loading') {
            this.iconPath = new vscode.ThemeIcon('sync~spin');
            this.tooltip = 'Loading steering documents...';
        } else if (contextValue === 'claude-md-global') {
            this.iconPath = new vscode.ThemeIcon('globe');
            this.tooltip = `Global CLAUDE.md: ${resourcePath}`;
            this.description = '~/.claude/CLAUDE.md';
        } else if (contextValue === 'claude-md-project') {
            this.iconPath = new vscode.ThemeIcon('root-folder');
            this.tooltip = `Project CLAUDE.md: ${resourcePath}`;
            this.description = 'CLAUDE.md';
        } else if (contextValue === 'create-global-claude') {
            this.iconPath = new vscode.ThemeIcon('globe');
            this.tooltip = 'Click to create Global CLAUDE.md';
        } else if (contextValue === 'create-project-claude') {
            this.iconPath = new vscode.ThemeIcon('root-folder');
            this.tooltip = 'Click to create Project CLAUDE.md';
        } else if (contextValue === 'separator') {
            this.iconPath = undefined;
            this.description = undefined;
        } else if (contextValue === 'steering-header') {
            this.iconPath = new vscode.ThemeIcon('folder-library');
            this.description = undefined;
            // Make it visually distinct but not clickable
            this.tooltip = 'Generated project steering documents';
        } else if (contextValue === 'steering-document') {
            // Different icons for different steering documents
            if (label === 'product') {
                this.iconPath = new vscode.ThemeIcon('lightbulb-empty');
            } else if (label === 'tech') {
                this.iconPath = new vscode.ThemeIcon('circuit-board');
            } else if (label === 'structure') {
                this.iconPath = new vscode.ThemeIcon('list-tree');
            } else {
                this.iconPath = new vscode.ThemeIcon('file');
            }
            this.tooltip = `Steering document: ${resourcePath}`;
            this.description = filename; // Show the relative path
        }

        // Don't set resourceUri to avoid showing diagnostic counts
        // if (resourcePath) {
        //     this.resourceUri = vscode.Uri.file(resourcePath);
        // }
    }
}