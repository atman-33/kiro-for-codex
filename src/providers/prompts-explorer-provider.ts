import * as path from "path";
import * as vscode from "vscode";
import { ConfigManager } from "../utils/config-manager";
import type { CodexProvider } from "./codex-provider";

export class PromptsExplorerProvider
	implements vscode.TreeDataProvider<PromptItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<
		PromptItem | undefined | null | void
	> = new vscode.EventEmitter<PromptItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<
		PromptItem | undefined | null | void
	> = this._onDidChangeTreeData.event;

	private configManager: ConfigManager;
	private codexProvider: CodexProvider;
	private isLoading = false;

	constructor(
		private context: vscode.ExtensionContext,
		codexProvider: CodexProvider,
	) {
		this.configManager = ConfigManager.getInstance();
		this.configManager.loadSettings();
		this.codexProvider = codexProvider;
	}

	refresh(): void {
		this.isLoading = true;
		this._onDidChangeTreeData.fire();
		setTimeout(() => {
			this.isLoading = false;
			this._onDidChangeTreeData.fire();
		}, 100);
	}

	getTreeItem(element: PromptItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: PromptItem): Promise<PromptItem[]> {
		if (!vscode.workspace.workspaceFolders) return [];

		if (!element) {
			const items: PromptItem[] = [];

			if (this.isLoading) {
				items.push(
					new PromptItem(
						"Loading prompts...",
						vscode.TreeItemCollapsibleState.None,
						"prompts-loading",
					),
				);
				return items;
			}

			const ws = vscode.workspace.workspaceFolders[0].uri.fsPath;
			const promptsBase = path.join(ws, this.configManager.getPath("prompts"));

			let files: string[] = [];
			try {
				files = await this.readMarkdownFiles(promptsBase);
			} catch {
				// No directory yet
			}

			if (files.length === 0) {
				items.push(
					new PromptItem(
						"No prompts found",
						vscode.TreeItemCollapsibleState.None,
						"prompts-empty",
					),
				);
				return items;
			}

			return files.map(
				(fp) =>
					new PromptItem(
						path.basename(fp),
						vscode.TreeItemCollapsibleState.None,
						"prompt",
						fp,
						{
							command: "vscode.open",
							title: "Open Prompt",
							arguments: [vscode.Uri.file(fp)],
						},
					),
			);
		}

		return [];
	}

	private async readMarkdownFiles(dir: string): Promise<string[]> {
		const out: string[] = [];
		try {
			const entries = await vscode.workspace.fs.readDirectory(
				vscode.Uri.file(dir),
			);
			for (const [name, type] of entries) {
				const full = path.join(dir, name);
				if (type === vscode.FileType.File && name.endsWith(".md"))
					out.push(full);
				else if (type === vscode.FileType.Directory) {
					const nested = await this.readMarkdownFiles(full);
					out.push(...nested);
				}
			}
		} catch {
			// ignore
		}
		return out;
	}
}

class PromptItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly contextValue: string,
		public readonly resourcePath?: string,
		public readonly command?: vscode.Command,
	) {
		super(label, collapsibleState);

		if (contextValue === "prompts-loading") {
			this.iconPath = new vscode.ThemeIcon("sync~spin");
			this.tooltip = "Loading prompts...";
		} else if (contextValue === "prompts-empty") {
			this.iconPath = new vscode.ThemeIcon("info");
			this.tooltip = "Create prompts under .codex/prompts";
		} else if (contextValue === "prompt") {
			this.iconPath = new vscode.ThemeIcon("symbol-string");
			this.tooltip = resourcePath || "";
			if (resourcePath) {
				this.resourceUri = vscode.Uri.file(resourcePath);
				this.description = path.basename(resourcePath);
			}
		}
	}
}
