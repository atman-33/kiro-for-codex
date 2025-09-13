import * as fs from "fs";
import * as os from "os";
import * as vscode from "vscode";
import {
	CONFIG_FILE_NAME,
	ENABLE_AGENTS_UI,
	ENABLE_HOOKS_UI,
	ENABLE_MCP_UI,
	ENABLE_SPEC_AGENTS,
	VSC_CONFIG_NAMESPACE,
} from "./constants";
import { AgentManager } from "./features/agents/agent-manager";
import { ChatManager } from "./features/codex-chat/chat-manager";
import { SpecManager } from "./features/spec/spec-manager";
import { SteeringManager } from "./features/steering/steering-manager";
import { AgentsExplorerProvider } from "./providers/agents-explorer-provider";
import { CodexChatPanelProvider } from "./providers/codex-chat-panel-provider";
import { CodexProvider } from "./providers/codex-provider";
import { HooksExplorerProvider } from "./providers/hooks-explorer-provider";
import { MCPExplorerProvider } from "./providers/mcp-explorer-provider";
import { OverviewProvider } from "./providers/overview-provider";
import { PromptsExplorerProvider } from "./providers/prompts-explorer-provider";
import { SpecExplorerProvider } from "./providers/spec-explorer-provider";
import { SpecTaskCodeLensProvider } from "./providers/spec-task-code-lens-provider";
import { SteeringExplorerProvider } from "./providers/steering-explorer-provider";
import { PromptLoader } from "./services/prompt-loader";
import { ConfigManager } from "./utils/config-manager";
import { UpdateChecker } from "./utils/update-checker";

let codexProvider: CodexProvider;
let specManager: SpecManager;
let steeringManager: SteeringManager;
let agentManager: AgentManager;
export let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
	// Create output channel for debugging
	outputChannel = vscode.window.createOutputChannel("Kiro for Codex - Debug");

	// Initialize PromptLoader
	try {
		const promptLoader = PromptLoader.getInstance();
		promptLoader.initialize();
		outputChannel.appendLine("PromptLoader initialized successfully");
	} catch (error) {
		outputChannel.appendLine(`Failed to initialize PromptLoader: ${error}`);
		vscode.window.showErrorMessage(
			`Failed to initialize prompt system: ${error}`,
		);
	}

	// Check workspace status
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		outputChannel.appendLine("WARNING: No workspace folder found!");
	}

	// Initialize Codex provider
	codexProvider = new CodexProvider(context, outputChannel);

	// Check Codex availability on startup
	const codexAvailable = await codexProvider.isCodexReady();
	if (!codexAvailable) {
		outputChannel.appendLine(
			"WARNING: Codex CLI is not available. Some features may not work.",
		);
		const availabilityResult = await codexProvider.getCodexAvailabilityStatus();
		await codexProvider.showSetupGuidance(availabilityResult);
	}

	// Initialize feature managers with output channel
	specManager = new SpecManager(codexProvider, outputChannel);
	steeringManager = new SteeringManager(codexProvider, outputChannel);

	// Initialize Agent Manager (UI may be disabled separately)
	agentManager = new AgentManager(context, outputChannel, codexProvider);
	if (ENABLE_AGENTS_UI) {
		await agentManager.initializeBuiltInAgents();
	}

	// Register tree data providers
	const overviewProvider = new OverviewProvider(context);
	const specExplorer = new SpecExplorerProvider(context, outputChannel);
	const steeringExplorer = new SteeringExplorerProvider(context);
	// Guard Hooks UI to avoid invoking not-yet-implemented CLI hooks
	const hooksExplorer: HooksExplorerProvider | undefined = ENABLE_HOOKS_UI
		? new HooksExplorerProvider(context)
		: undefined;
	// Guard MCP UI to avoid invoking non-existent CLI commands
	const mcpExplorer: MCPExplorerProvider | undefined = ENABLE_MCP_UI
		? new MCPExplorerProvider(context, outputChannel)
		: undefined;
	const agentsExplorer = ENABLE_AGENTS_UI
		? new AgentsExplorerProvider(context, agentManager, outputChannel)
		: undefined;
	const promptsExplorer = new PromptsExplorerProvider(context, codexProvider);

	// Set managers
	specExplorer.setSpecManager(specManager);
	steeringExplorer.setSteeringManager(steeringManager);

	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"kfc.views.overview",
			overviewProvider,
		),
		vscode.window.registerTreeDataProvider(
			"kfc.views.specExplorer",
			specExplorer,
		),
		vscode.window.registerTreeDataProvider(
			"kfc.views.steeringExplorer",
			steeringExplorer,
		),
	);
	if (ENABLE_AGENTS_UI && agentsExplorer) {
		context.subscriptions.push(
			vscode.window.registerTreeDataProvider(
				"kfc.views.agentsExplorer",
				agentsExplorer,
			),
		);
	}
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"kfc.views.promptsExplorer",
			promptsExplorer,
		),
	);
	if (ENABLE_HOOKS_UI && hooksExplorer) {
		context.subscriptions.push(
			vscode.window.registerTreeDataProvider(
				"kfc.views.hooksStatus",
				hooksExplorer,
			),
		);
	}

	if (ENABLE_MCP_UI && mcpExplorer) {
		context.subscriptions.push(
			vscode.window.registerTreeDataProvider(
				"kfc.views.mcpServerStatus",
				mcpExplorer,
			),
		);
	}

	// Initialize update checker
	const updateChecker = new UpdateChecker(context, outputChannel);

	// Register commands
	registerCommands(
		context,
		specExplorer,
		steeringExplorer,
		hooksExplorer,
		mcpExplorer,
		agentsExplorer,
		promptsExplorer,
		updateChecker,
	);

	// Initialize default settings file if not exists
	await initializeDefaultSettings();

	// Set up file watchers
	setupFileWatchers(
		context,
		specExplorer,
		steeringExplorer,
		hooksExplorer,
		mcpExplorer,
		agentsExplorer,
		promptsExplorer,
	);

	// Check for updates on startup
	updateChecker.checkForUpdates();
	outputChannel.appendLine("Update check initiated");

	// Register CodeLens provider for spec tasks
	const specTaskCodeLensProvider = new SpecTaskCodeLensProvider();

	// Use document selector for .codex spec directories
	const selector: vscode.DocumentSelector = [
		{
			language: "markdown",
			pattern: "**/.codex/specs/*/tasks.md",
			scheme: "file",
		},
	];

	const disposable = vscode.languages.registerCodeLensProvider(
		selector,
		specTaskCodeLensProvider,
	);

	context.subscriptions.push(disposable);

	outputChannel.appendLine("CodeLens provider for spec tasks registered");
}

async function initializeDefaultSettings() {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return;
	}

	// Create .codex/settings directory if it doesn't exist (primary)
	const codexDir = vscode.Uri.joinPath(workspaceFolder.uri, ".codex");
	const codexSettingsDir = vscode.Uri.joinPath(codexDir, "settings");

	try {
		await vscode.workspace.fs.createDirectory(codexDir);
		await vscode.workspace.fs.createDirectory(codexSettingsDir);
	} catch (error) {
		// Directory might already exist
	}

	// Create kfc-settings.json in .codex directory
	const codexSettingsFile = vscode.Uri.joinPath(
		codexSettingsDir,
		CONFIG_FILE_NAME,
	);

	try {
		// Check if file exists in .codex directory
		await vscode.workspace.fs.stat(codexSettingsFile);
	} catch (error) {
		// File doesn't exist, create with defaults
		const configManager = ConfigManager.getInstance();
		const defaultSettings = configManager.getSettings();

		await vscode.workspace.fs.writeFile(
			codexSettingsFile,
			Buffer.from(JSON.stringify(defaultSettings, null, 2)),
		);
	}
}

async function toggleViews() {
	const config = vscode.workspace.getConfiguration(VSC_CONFIG_NAMESPACE);
	const currentVisibility = {
		specs: config.get("views.specs.visible", true),
		hooks: config.get("views.hooks.visible", false),
		steering: config.get("views.steering.visible", true),
		mcp: config.get("views.mcp.visible", false),
	};

	const items: Array<{ label: string; picked: boolean; id: string }> = [
		{
			label: `$(${currentVisibility.specs ? "check" : "blank"}) Specs`,
			picked: currentVisibility.specs,
			id: "specs",
		},

		{
			label: `$(${currentVisibility.steering ? "check" : "blank"}) Agent Steering`,
			picked: currentVisibility.steering,
			id: "steering",
		},
	];
	if (ENABLE_HOOKS_UI) {
		items.splice(1, 0, {
			label: `$(${currentVisibility.hooks ? "check" : "blank"}) Agent Hooks`,
			picked: currentVisibility.hooks,
			id: "hooks",
		});
	}

	if (ENABLE_MCP_UI) {
		items.push({
			label: `$(${currentVisibility.mcp ? "check" : "blank"}) MCP Servers`,
			picked: currentVisibility.mcp,
			id: "mcp",
		});
	}

	const selected = await vscode.window.showQuickPick(items, {
		canPickMany: true,
		placeHolder: "Select views to show",
	});

	if (selected) {
		const newVisibility = {
			specs: selected.some((item) => item.id === "specs"),
			hooks: selected.some((item) => item.id === "hooks"),
			steering: selected.some((item) => item.id === "steering"),
			mcp: selected.some((item) => item.id === "mcp"),
		};

		await config.update(
			"views.specs.visible",
			newVisibility.specs,
			vscode.ConfigurationTarget.Workspace,
		);
		if (ENABLE_HOOKS_UI) {
			await config.update(
				"views.hooks.visible",
				newVisibility.hooks,
				vscode.ConfigurationTarget.Workspace,
			);
		}
		await config.update(
			"views.steering.visible",
			newVisibility.steering,
			vscode.ConfigurationTarget.Workspace,
		);
		if (ENABLE_MCP_UI) {
			await config.update(
				"views.mcp.visible",
				newVisibility.mcp,
				vscode.ConfigurationTarget.Workspace,
			);
		}

		vscode.window.showInformationMessage("View visibility updated!");
	}
}

function registerCommands(
	context: vscode.ExtensionContext,
	specExplorer: SpecExplorerProvider,
	steeringExplorer: SteeringExplorerProvider,
	hooksExplorer: HooksExplorerProvider | undefined,
	mcpExplorer: MCPExplorerProvider | undefined,
	agentsExplorer: AgentsExplorerProvider | undefined,
	promptsExplorer: PromptsExplorerProvider,
	updateChecker: UpdateChecker,
) {
	// Spec commands
	const createSpecCommand = vscode.commands.registerCommand(
		"kfc.spec.create",
		async () => {
			outputChannel.appendLine("\n=== COMMAND kfc.spec.create TRIGGERED ===");
			outputChannel.appendLine(`Time: ${new Date().toLocaleTimeString()}`);

			try {
				await specManager.create();
			} catch (error) {
				outputChannel.appendLine(`Error in createNewSpec: ${error}`);
				vscode.window.showErrorMessage(`Failed to create spec: ${error}`);
			}
		},
	);

	// Guard: "New Spec with Agents" is disabled for Codex build
	const createSpecWithAgentsCommand = vscode.commands.registerCommand(
		"kfc.spec.createWithAgents",
		async () => {
			if (!ENABLE_SPEC_AGENTS) {
				vscode.window.showInformationMessage(
					"New Spec with Agents is disabled in this build.",
				);
				return;
			}
			try {
				await specManager.createWithAgents();
			} catch (error) {
				outputChannel.appendLine(`Error in createWithAgents: ${error}`);
				vscode.window.showErrorMessage(
					`Failed to create spec with agents: ${error}`,
				);
			}
		},
	);

	context.subscriptions.push(createSpecCommand, createSpecWithAgentsCommand);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"kfc.spec.navigate.requirements",
			async (specName: string) => {
				await specManager.navigateToDocument(specName, "requirements");
			},
		),

		vscode.commands.registerCommand(
			"kfc.spec.navigate.design",
			async (specName: string) => {
				await specManager.navigateToDocument(specName, "design");
			},
		),

		vscode.commands.registerCommand(
			"kfc.spec.navigate.tasks",
			async (specName: string) => {
				await specManager.navigateToDocument(specName, "tasks");
			},
		),

		vscode.commands.registerCommand(
			"kfc.spec.implTask",
			async (
				documentUri: vscode.Uri,
				lineNumber: number,
				taskDescription: string,
			) => {
				outputChannel.appendLine(
					`[Task Execute] Line ${lineNumber + 1}: ${taskDescription}`,
				);

				// Update task status to completed
				const document = await vscode.workspace.openTextDocument(documentUri);
				const edit = new vscode.WorkspaceEdit();
				const line = document.lineAt(lineNumber);
				const newLine = line.text.replace("- [ ]", "- [x]");
				const range = new vscode.Range(
					lineNumber,
					0,
					lineNumber,
					line.text.length,
				);
				edit.replace(documentUri, range, newLine);
				await vscode.workspace.applyEdit(edit);

				// Use Codex CLI to execute task
				await specManager.implTask(documentUri.fsPath, taskDescription);
			},
		),
		vscode.commands.registerCommand("kfc.spec.refresh", async () => {
			outputChannel.appendLine("[Manual Refresh] Refreshing spec explorer...");
			specExplorer.refresh();
		}),
	);

	// Webview (Codex Chat preview)
	context.subscriptions.push(
		vscode.commands.registerCommand("kfc.codexChat.open", async () => {
			const chatManager = new ChatManager(codexProvider, outputChannel);
			CodexChatPanelProvider.open(context, chatManager);
		}),
	);

	// Steering commands
	context.subscriptions.push(
		vscode.commands.registerCommand("kfc.steering.create", async () => {
			await steeringManager.createCustom();
		}),

		vscode.commands.registerCommand(
			"kfc.steering.generateInitial",
			async () => {
				await steeringManager.init();
			},
		),

		vscode.commands.registerCommand(
			"kfc.steering.refine",
			async (item: any) => {
				// Item is always from tree view
				const uri = vscode.Uri.file(item.resourcePath);
				await steeringManager.refine(uri);
			},
		),

		vscode.commands.registerCommand(
			"kfc.steering.delete",
			async (item: any) => {
				outputChannel.appendLine(`[Steering] Deleting: ${item.label}`);

				// Use SteeringManager to delete the document
				const result = await steeringManager.delete(
					item.label,
					item.resourcePath,
				);

				if (!result.success && result.error) {
					vscode.window.showErrorMessage(result.error);
				}
			},
		),

		// Configuration commands
		vscode.commands.registerCommand("kfc.steering.createUserRule", async () => {
			await steeringManager.createUserConfiguration();
		}),

		vscode.commands.registerCommand(
			"kfc.steering.createProjectRule",
			async () => {
				await steeringManager.createProjectDocumentation();
			},
		),

		vscode.commands.registerCommand("kfc.steering.refresh", async () => {
			outputChannel.appendLine(
				"[Manual Refresh] Refreshing steering explorer...",
			);
			steeringExplorer.refresh();
		}),

		// Agents commands
		...(ENABLE_AGENTS_UI && agentsExplorer
			? [
					vscode.commands.registerCommand("kfc.agents.refresh", async () => {
						outputChannel.appendLine(
							"[Manual Refresh] Refreshing agents explorer...",
						);
						agentsExplorer.refresh();
					}),
				]
			: []),
	);

	// Add file save confirmation for agent files
	context.subscriptions.push(
		vscode.workspace.onWillSaveTextDocument(async (event) => {
			const document = event.document;
			const filePath = document.fileName;

			// Check if this is an agent file in .codex directories
			if (filePath.includes(".codex/agents/") && filePath.endsWith(".md")) {
				// Show confirmation dialog
				const result = await vscode.window.showWarningMessage(
					"Are you sure you want to save changes to this agent file?",
					{ modal: true },
					"Save",
					"Cancel",
				);

				if (result !== "Save") {
					// Cancel the save operation by waiting forever
					event.waitUntil(new Promise(() => {}));
				}
			}
		}),
	);

	// Spec delete command
	context.subscriptions.push(
		vscode.commands.registerCommand("kfc.spec.delete", async (item: any) => {
			await specManager.delete(item.label);
		}),
	);

	// Codex integration commands
	// Codex CLI integration commands

	// Hooks commands
	if (ENABLE_HOOKS_UI && hooksExplorer) {
		context.subscriptions.push(
			vscode.commands.registerCommand("kfc.hooks.refresh", () => {
				hooksExplorer.refresh();
			}),
			vscode.commands.registerCommand(
				"kfc.hooks.copyCommand",
				async (command: string) => {
					await vscode.env.clipboard.writeText(command);
				},
			),
		);
	}

	// MCP commands (only when enabled)
	if (ENABLE_MCP_UI && mcpExplorer) {
		context.subscriptions.push(
			vscode.commands.registerCommand("kfc.mcp.refresh", () => {
				mcpExplorer.refresh();
			}),
		);
	}

	// Prompts commands
	context.subscriptions.push(
		vscode.commands.registerCommand("kfc.prompts.refresh", async () => {
			outputChannel.appendLine(
				"[Manual Refresh] Refreshing prompts explorer...",
			);
			promptsExplorer.refresh();
		}),
		vscode.commands.registerCommand("kfc.prompts.create", async () => {
			const ws = vscode.workspace.workspaceFolders?.[0];
			if (!ws) {
				vscode.window.showErrorMessage("No workspace folder found");
				return;
			}
			const name = await vscode.window.showInputBox({
				title: "Create Prompt",
				placeHolder: "prompt name (kebab-case)",
				prompt: "A markdown file will be created under .codex/prompts",
				validateInput: (v) => (!v ? "Name is required" : undefined),
			});
			if (!name) return;
			const dir = vscode.Uri.joinPath(ws.uri, ".codex", "prompts");
			const file = vscode.Uri.joinPath(dir, `${name}.md`);
			try {
				await vscode.workspace.fs.createDirectory(dir);
				const content = Buffer.from(
					`# ${name}\n\nDescribe your prompt here. This file will be sent to Codex when executed.\n`,
				);
				await vscode.workspace.fs.writeFile(file, content);
				const doc = await vscode.workspace.openTextDocument(file);
				await vscode.window.showTextDocument(doc);
				promptsExplorer.refresh();
			} catch (e) {
				vscode.window.showErrorMessage(`Failed to create prompt: ${e}`);
			}
		}),
		vscode.commands.registerCommand(
			"kfc.prompts.run",
			async (filePathOrItem?: any) => {
				try {
					let target: string | undefined;

					// 1) If called with a string path
					if (typeof filePathOrItem === "string") {
						target = filePathOrItem;
					}
					// 2) If invoked from a tree item (inline button)
					else if (filePathOrItem && typeof filePathOrItem === "object") {
						const candidate =
							(filePathOrItem.resourcePath as string | undefined) ||
							filePathOrItem.resourceUri?.fsPath;
						if (candidate) target = candidate;
					}
					// 3) Fallback to active editor
					if (!target) {
						const active = vscode.window.activeTextEditor?.document.uri.fsPath;
						target = active;
					}
					if (!target) {
						vscode.window.showErrorMessage("No prompt file selected");
						return;
					}
					const content = await fs.promises.readFile(target, "utf8");
					await codexProvider.invokeCodexSplitView(
						content,
						`Codex - Prompt: ${require("path").basename(target)}`,
					);
				} catch (e) {
					vscode.window.showErrorMessage(`Failed to run prompt: ${e}`);
				}
			},
		),
	);

	// Update checker command

	// Group the following commands in a single subscriptions push
	context.subscriptions.push(
		vscode.commands.registerCommand("kfc.checkForUpdates", async () => {
			outputChannel.appendLine("Manual update check requested");
			await updateChecker.checkForUpdates(true); // Force check
		}),

		// Overview and settings commands
		vscode.commands.registerCommand("kfc.settings.open", async () => {
			outputChannel.appendLine("Opening Kiro settings...");

			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				vscode.window.showErrorMessage("No workspace folder found");
				return;
			}

			// Create .codex/settings directory if it doesn't exist
			const codexDir = vscode.Uri.joinPath(workspaceFolder.uri, ".codex");
			const settingsDir = vscode.Uri.joinPath(codexDir, "settings");

			try {
				await vscode.workspace.fs.createDirectory(codexDir);
				await vscode.workspace.fs.createDirectory(settingsDir);
			} catch (error) {
				// Directory might already exist
			}

			// Create or open kfc-settings.json
			const settingsFile = vscode.Uri.joinPath(settingsDir, CONFIG_FILE_NAME);

			try {
				// Check if file exists
				await vscode.workspace.fs.stat(settingsFile);
			} catch (error) {
				// File doesn't exist, create it with default settings
				const configManager = ConfigManager.getInstance();
				const defaultSettings = configManager.getSettings();

				await vscode.workspace.fs.writeFile(
					settingsFile,
					Buffer.from(JSON.stringify(defaultSettings, null, 2)),
				);
			}

			// Open the settings file
			const document = await vscode.workspace.openTextDocument(settingsFile);
			await vscode.window.showTextDocument(document);
		}),

		vscode.commands.registerCommand("kfc.help.open", async () => {
			outputChannel.appendLine("Opening Kiro help...");
			const helpUrl = "https://github.com/atman-33/kiro-for-codex#readme";
			vscode.env.openExternal(vscode.Uri.parse(helpUrl));
		}),

		vscode.commands.registerCommand("kfc.menu.open", async () => {
			outputChannel.appendLine("Opening Kiro menu...");
			await toggleViews();
		}),

		// Codex availability check command
		vscode.commands.registerCommand("kfc.codex.checkAvailability", async () => {
			const availabilityResult =
				await codexProvider.getCodexAvailabilityStatus();

			const statusMessage = availabilityResult.isAvailable
				? `✅ Codex CLI v${availabilityResult.version} is available and ready`
				: `❌ Codex CLI is not available: ${availabilityResult.errorMessage}`;

			vscode.window.showInformationMessage(statusMessage);

			outputChannel.appendLine(
				`[Codex Check] Available: ${availabilityResult.isAvailable}`,
			);
			outputChannel.appendLine(
				`[Codex Check] Installed: ${availabilityResult.isInstalled}`,
			);
			outputChannel.appendLine(
				`[Codex Check] Version: ${availabilityResult.version || "Unknown"}`,
			);
			outputChannel.appendLine(
				`[Codex Check] Compatible: ${availabilityResult.isCompatible}`,
			);

			if (availabilityResult.errorMessage) {
				outputChannel.appendLine(
					`[Codex Check] Error: ${availabilityResult.errorMessage}`,
				);
			}

			if (!availabilityResult.isAvailable && availabilityResult.setupGuidance) {
				await codexProvider.showSetupGuidance(availabilityResult);
			}
		}),
	);
}

function setupFileWatchers(
	context: vscode.ExtensionContext,
	specExplorer: SpecExplorerProvider,
	steeringExplorer: SteeringExplorerProvider,
	hooksExplorer: HooksExplorerProvider | undefined,
	mcpExplorer: MCPExplorerProvider | undefined,
	agentsExplorer: AgentsExplorerProvider | undefined,
	promptsExplorer: PromptsExplorerProvider,
) {
	// Watch for changes in .codex directories with debouncing
	const codexWatcher =
		vscode.workspace.createFileSystemWatcher("**/.codex/**/*");

	let refreshTimeout: NodeJS.Timeout | undefined;
	const debouncedRefresh = (event: string, uri: vscode.Uri) => {
		outputChannel.appendLine(`[FileWatcher] ${event}: ${uri.fsPath}`);

		if (refreshTimeout) {
			clearTimeout(refreshTimeout);
		}
		refreshTimeout = setTimeout(() => {
			specExplorer.refresh();
			steeringExplorer.refresh();
			hooksExplorer?.refresh();
			mcpExplorer?.refresh();
			agentsExplorer?.refresh();
			promptsExplorer.refresh();
		}, 1000); // Increase debounce time to 1 second
	};

	codexWatcher.onDidCreate((uri) => debouncedRefresh("Create", uri));
	codexWatcher.onDidDelete((uri) => debouncedRefresh("Delete", uri));
	codexWatcher.onDidChange((uri) => debouncedRefresh("Change", uri));

	context.subscriptions.push(codexWatcher);

	// Watch for changes in workspace Codex settings (.codex/settings/kfc-settings.json)
	const wsFolder = vscode.workspace.workspaceFolders?.[0];
	if (wsFolder) {
		const settingsPattern = new vscode.RelativePattern(
			wsFolder,
			".codex/settings/kfc-settings.json",
		);
		const codexSettingsWatcher =
			vscode.workspace.createFileSystemWatcher(settingsPattern);

		codexSettingsWatcher.onDidChange(() => {
			hooksExplorer?.refresh();
			mcpExplorer?.refresh();
		});

		context.subscriptions.push(codexSettingsWatcher);
	}

	// Watch for changes in CODEX.md files
	const globalHome = os.homedir() || process.env.USERPROFILE || "";
	const globalCodexMdWatcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(globalHome, ".codex/CODEX.md"),
	);
	const projectCodexMdWatcher =
		vscode.workspace.createFileSystemWatcher("**/CODEX.md");

	globalCodexMdWatcher.onDidCreate(() => steeringExplorer.refresh());
	globalCodexMdWatcher.onDidDelete(() => steeringExplorer.refresh());
	projectCodexMdWatcher.onDidCreate(() => steeringExplorer.refresh());
	projectCodexMdWatcher.onDidDelete(() => steeringExplorer.refresh());

	context.subscriptions.push(globalCodexMdWatcher, projectCodexMdWatcher);
}

export function deactivate() {
	// Cleanup Codex provider resources
	if (codexProvider) {
		codexProvider.cancelAllRetries();
	}
}
