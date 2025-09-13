import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import type { SteeringManager } from "../features/steering/steering-manager";

export class SteeringExplorerProvider
	implements vscode.TreeDataProvider<SteeringItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<
		SteeringItem | undefined | null | void
	> = new vscode.EventEmitter<SteeringItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<
		SteeringItem | undefined | null | void
	> = this._onDidChangeTreeData.event;

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
			// Root level - show loading state or KIRO.md files
			const items: SteeringItem[] = [];

			if (this.isLoading) {
				// Show loading state
				items.push(
					new SteeringItem(
						"Loading steering documents...",
						vscode.TreeItemCollapsibleState.None,
						"steering-loading",
						"", // resourcePath
						this.context,
					),
				);
				return items;
			}

			// Check existence of files
			const homeDir = os.homedir() || process.env.USERPROFILE || "";
			const globalConfigFile = path.join(homeDir, ".codex", "config.toml");
			const globalExists = fs.existsSync(globalConfigFile);

			let projectDocFile = "";
			let projectExists = false;
			if (vscode.workspace.workspaceFolders) {
				// Check for AGENTS.md file specifically for Codex
				const agentsFilePath = path.join(
					vscode.workspace.workspaceFolders[0].uri.fsPath,
					"AGENTS.md",
				);
				if (fs.existsSync(agentsFilePath)) {
					projectDocFile = agentsFilePath;
					projectExists = true;
				}
			}

			// Always show Global Config and Project Documentation (if they exist)
			if (globalExists) {
				items.push(
					new SteeringItem(
						"Global Config",
						vscode.TreeItemCollapsibleState.None,
						"config-global",
						globalConfigFile,
						this.context,
						{
							command: "vscode.open",
							title: "Open Global Configuration",
							arguments: [vscode.Uri.file(globalConfigFile)],
						},
					),
				);
			}

			if (projectExists) {
				items.push(
					new SteeringItem(
						"Agents Config",
						vscode.TreeItemCollapsibleState.None,
						"agents-project",
						projectDocFile,
						this.context,
						{
							command: "vscode.open",
							title: "Open Agents Configuration",
							arguments: [vscode.Uri.file(projectDocFile)],
						},
					),
				);
			}

			// Traditional steering documents - add them directly at root level if they exist
			if (vscode.workspace.workspaceFolders && this.steeringManager) {
				const steeringDocs = await this.steeringManager.getSteeringDocuments();
				if (steeringDocs.length > 0) {
					// Add a collapsible header item for steering documents
					items.push(
						new SteeringItem(
							"Steering Docs",
							vscode.TreeItemCollapsibleState.Expanded, // Make it expandable
							"steering-header",
							"",
							this.context,
						),
					);
				}
			}

			// Add create buttons at the bottom for missing files
			if (!globalExists) {
				items.push(
					new SteeringItem(
						"Create Global Config",
						vscode.TreeItemCollapsibleState.None,
						"create-global-config",
						"",
						this.context,
						{
							command: "kfc.steering.createUserRule",
							title: "Create Global Configuration",
						},
					),
				);
			}

			if (vscode.workspace.workspaceFolders && !projectExists) {
				items.push(
					new SteeringItem(
						"Create Agents Config",
						vscode.TreeItemCollapsibleState.None,
						"create-agents-config",
						"",
						this.context,
						{
							command: "kfc.steering.createProjectRule",
							title: "Create Agents Configuration",
						},
					),
				);
			}

			return items;
		} else if (element.contextValue === "steering-header") {
			// Return steering documents as children of the header
			const items: SteeringItem[] = [];

			if (vscode.workspace.workspaceFolders && this.steeringManager) {
				const steeringDocs = await this.steeringManager.getSteeringDocuments();
				const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;

				for (const doc of steeringDocs) {
					// Calculate relative path from workspace root
					const relativePath = path.relative(workspacePath, doc.path);
					items.push(
						new SteeringItem(
							doc.name,
							vscode.TreeItemCollapsibleState.None,
							"steering-document",
							doc.path,
							this.context,
							{
								command: "vscode.open",
								title: "Open Steering Document",
								arguments: [vscode.Uri.file(doc.path)],
							},
							relativePath, // Pass relative path without prefix
						),
					);
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
		private readonly filename?: string,
	) {
		super(label, collapsibleState);

		// Set appropriate icons based on type
		if (contextValue === "steering-loading") {
			this.iconPath = new vscode.ThemeIcon("sync~spin");
			this.tooltip = "Loading steering documents...";
		} else if (contextValue === "config-global") {
			this.iconPath = new vscode.ThemeIcon("globe");
			this.tooltip = `Global Configuration: ${resourcePath}`;
			this.description = "~/.codex/config.toml";
		} else if (contextValue === "agents-project") {
			this.iconPath = new vscode.ThemeIcon("robot");
			this.tooltip = `Agents Configuration: ${resourcePath}`;
			this.description = "AGENTS.md";
		} else if (contextValue === "create-global-config") {
			this.iconPath = new vscode.ThemeIcon("globe");
			this.tooltip = "Click to create Global Configuration";
		} else if (contextValue === "create-agents-config") {
			this.iconPath = new vscode.ThemeIcon("robot");
			this.tooltip = "Click to create Agents Configuration";
		} else if (contextValue === "separator") {
			this.iconPath = undefined;
			this.description = undefined;
		} else if (contextValue === "steering-header") {
			this.iconPath = new vscode.ThemeIcon("folder-library");
			this.description = undefined;
			// Make it visually distinct but not clickable
			this.tooltip = "Generated project steering documents";
		} else if (contextValue === "steering-document") {
			// Different icons for different steering documents
			if (label === "product") {
				this.iconPath = new vscode.ThemeIcon("lightbulb-empty");
			} else if (label === "tech") {
				this.iconPath = new vscode.ThemeIcon("circuit-board");
			} else if (label === "structure") {
				this.iconPath = new vscode.ThemeIcon("list-tree");
			} else {
				this.iconPath = new vscode.ThemeIcon("file");
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
