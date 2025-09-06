import * as vscode from 'vscode';
import { CONFIG_FILE_NAME, VSC_CONFIG_NAMESPACE } from './constants';
import { AgentManager } from './features/agents/agentManager';
import { SpecManager } from './features/spec/specManager';
import { SteeringManager } from './features/steering/steeringManager';
import { AgentsExplorerProvider } from './providers/agentsExplorerProvider';
import { CodexProvider } from './providers/codexProvider';
import { HooksExplorerProvider } from './providers/hooksExplorerProvider';
import { MCPExplorerProvider } from './providers/mcpExplorerProvider';
import { OverviewProvider } from './providers/overviewProvider';
import { SpecExplorerProvider } from './providers/specExplorerProvider';
import { SpecTaskCodeLensProvider } from './providers/specTaskCodeLensProvider';
import { SteeringExplorerProvider } from './providers/steeringExplorerProvider';
import { PromptLoader } from './services/promptLoader';
import { ConfigManager } from './utils/configManager';
import { UpdateChecker } from './utils/updateChecker';

let codexProvider: CodexProvider;
let specManager: SpecManager;
let steeringManager: SteeringManager;
let agentManager: AgentManager;
export let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
    // Create output channel for debugging
    outputChannel = vscode.window.createOutputChannel('Kiro for Codex - Debug');

    // Initialize PromptLoader
    try {
        const promptLoader = PromptLoader.getInstance();
        promptLoader.initialize();
        outputChannel.appendLine('PromptLoader initialized successfully');
    } catch (error) {
        outputChannel.appendLine(`Failed to initialize PromptLoader: ${error}`);
        vscode.window.showErrorMessage(`Failed to initialize prompt system: ${error}`);
    }

    // Check workspace status
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        outputChannel.appendLine('WARNING: No workspace folder found!');
    }

    // Initialize Codex provider
    codexProvider = new CodexProvider(context, outputChannel);

    // Check Codex availability on startup
    const codexAvailable = await codexProvider.isCodexReady();
    if (!codexAvailable) {
        outputChannel.appendLine('WARNING: Codex CLI is not available. Some features may not work.');
        const availabilityResult = await codexProvider.getCodexAvailabilityStatus();
        await codexProvider.showSetupGuidance(availabilityResult);
    }

    // Initialize feature managers with output channel
    specManager = new SpecManager(codexProvider, outputChannel);
    steeringManager = new SteeringManager(codexProvider, outputChannel);

    // Initialize Agent Manager and agents
    agentManager = new AgentManager(context, outputChannel, codexProvider);
    await agentManager.initializeBuiltInAgents();

    // Register tree data providers
    const overviewProvider = new OverviewProvider(context);
    const specExplorer = new SpecExplorerProvider(context, outputChannel);
    const steeringExplorer = new SteeringExplorerProvider(context);
    const hooksExplorer = new HooksExplorerProvider(context);
    const mcpExplorer = new MCPExplorerProvider(context, outputChannel);
    const agentsExplorer = new AgentsExplorerProvider(context, agentManager, outputChannel);

    // Set managers
    specExplorer.setSpecManager(specManager);
    steeringExplorer.setSteeringManager(steeringManager);

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('kfc.views.overview', overviewProvider),
        vscode.window.registerTreeDataProvider('kfc.views.specExplorer', specExplorer),
        vscode.window.registerTreeDataProvider('kfc.views.agentsExplorer', agentsExplorer),
        vscode.window.registerTreeDataProvider('kfc.views.steeringExplorer', steeringExplorer),
        vscode.window.registerTreeDataProvider('kfc.views.hooksStatus', hooksExplorer),
        vscode.window.registerTreeDataProvider('kfc.views.mcpServerStatus', mcpExplorer)
    );

    // Initialize update checker
    const updateChecker = new UpdateChecker(context, outputChannel);

    // Register commands
    registerCommands(context, specExplorer, steeringExplorer, hooksExplorer, mcpExplorer, agentsExplorer, updateChecker);

    // Initialize default settings file if not exists
    await initializeDefaultSettings();

    // Set up file watchers
    setupFileWatchers(context, specExplorer, steeringExplorer, hooksExplorer, mcpExplorer, agentsExplorer);

    // Check for updates on startup
    updateChecker.checkForUpdates();
    outputChannel.appendLine('Update check initiated');

    // Register CodeLens provider for spec tasks
    const specTaskCodeLensProvider = new SpecTaskCodeLensProvider();

    // Use document selector for both .claude and .kiro spec directories
    const selector: vscode.DocumentSelector = [
        {
            language: 'markdown',
            pattern: '**/.claude/specs/*/tasks.md',
            scheme: 'file'
        },
        {
            language: 'markdown',
            pattern: '**/.kiro/specs/*/tasks.md',
            scheme: 'file'
        }
    ];

    const disposable = vscode.languages.registerCodeLensProvider(
        selector,
        specTaskCodeLensProvider
    );

    context.subscriptions.push(disposable);

    outputChannel.appendLine('CodeLens provider for spec tasks registered');
}

async function initializeDefaultSettings() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    // Create .kiro/settings directory if it doesn't exist (primary)
    const kiroDir = vscode.Uri.joinPath(workspaceFolder.uri, '.kiro');
    const kiroSettingsDir = vscode.Uri.joinPath(kiroDir, 'settings');

    try {
        await vscode.workspace.fs.createDirectory(kiroDir);
        await vscode.workspace.fs.createDirectory(kiroSettingsDir);
    } catch (error) {
        // Directory might already exist
    }

    // Also maintain .claude directory for backward compatibility
    const claudeDir = vscode.Uri.joinPath(workspaceFolder.uri, '.claude');
    const claudeSettingsDir = vscode.Uri.joinPath(claudeDir, 'settings');

    try {
        await vscode.workspace.fs.createDirectory(claudeDir);
        await vscode.workspace.fs.createDirectory(claudeSettingsDir);
    } catch (error) {
        // Directory might already exist
    }

    // Create kfc-settings.json in .kiro directory (primary location)
    const kiroSettingsFile = vscode.Uri.joinPath(kiroSettingsDir, CONFIG_FILE_NAME);
    const claudeSettingsFile = vscode.Uri.joinPath(claudeSettingsDir, CONFIG_FILE_NAME);

    try {
        // Check if file exists in .kiro directory
        await vscode.workspace.fs.stat(kiroSettingsFile);
    } catch (error) {
        // File doesn't exist in .kiro, check .claude for migration
        let defaultSettings;
        try {
            // Try to read from .claude directory for migration
            const claudeSettingsContent = await vscode.workspace.fs.readFile(claudeSettingsFile);
            defaultSettings = JSON.parse(claudeSettingsContent.toString());
            outputChannel.appendLine('Migrated settings from .claude to .kiro directory');
        } catch (claudeError) {
            // No existing settings, use defaults
            const configManager = ConfigManager.getInstance();
            defaultSettings = configManager.getSettings();
        }

        await vscode.workspace.fs.writeFile(
            kiroSettingsFile,
            Buffer.from(JSON.stringify(defaultSettings, null, 2))
        );
    }
}

async function toggleViews() {
    const config = vscode.workspace.getConfiguration(VSC_CONFIG_NAMESPACE);
    const currentVisibility = {
        specs: config.get('views.specs.visible', true),
        hooks: config.get('views.hooks.visible', true),
        steering: config.get('views.steering.visible', true),
        mcp: config.get('views.mcp.visible', true)
    };

    const items = [
        {
            label: `$(${currentVisibility.specs ? 'check' : 'blank'}) Specs`,
            picked: currentVisibility.specs,
            id: 'specs'
        },
        {
            label: `$(${currentVisibility.hooks ? 'check' : 'blank'}) Agent Hooks`,
            picked: currentVisibility.hooks,
            id: 'hooks'
        },
        {
            label: `$(${currentVisibility.steering ? 'check' : 'blank'}) Agent Steering`,
            picked: currentVisibility.steering,
            id: 'steering'
        },
        {
            label: `$(${currentVisibility.mcp ? 'check' : 'blank'}) MCP Servers`,
            picked: currentVisibility.mcp,
            id: 'mcp'
        }
    ];

    const selected = await vscode.window.showQuickPick(items, {
        canPickMany: true,
        placeHolder: 'Select views to show'
    });

    if (selected) {
        const newVisibility = {
            specs: selected.some(item => item.id === 'specs'),
            hooks: selected.some(item => item.id === 'hooks'),
            steering: selected.some(item => item.id === 'steering'),
            mcp: selected.some(item => item.id === 'mcp')
        };

        await config.update('views.specs.visible', newVisibility.specs, vscode.ConfigurationTarget.Workspace);
        await config.update('views.hooks.visible', newVisibility.hooks, vscode.ConfigurationTarget.Workspace);
        await config.update('views.steering.visible', newVisibility.steering, vscode.ConfigurationTarget.Workspace);
        await config.update('views.mcp.visible', newVisibility.mcp, vscode.ConfigurationTarget.Workspace);

        vscode.window.showInformationMessage('View visibility updated!');
    }
}


function registerCommands(context: vscode.ExtensionContext, specExplorer: SpecExplorerProvider, steeringExplorer: SteeringExplorerProvider, hooksExplorer: HooksExplorerProvider, mcpExplorer: MCPExplorerProvider, agentsExplorer: AgentsExplorerProvider, updateChecker: UpdateChecker) {

    // Spec commands
    const createSpecCommand = vscode.commands.registerCommand('kfc.spec.create', async () => {
        outputChannel.appendLine('\n=== COMMAND kfc.spec.create TRIGGERED ===');
        outputChannel.appendLine(`Time: ${new Date().toLocaleTimeString()}`);

        try {
            await specManager.create();
        } catch (error) {
            outputChannel.appendLine(`Error in createNewSpec: ${error}`);
            vscode.window.showErrorMessage(`Failed to create spec: ${error}`);
        }
    });

    const createSpecWithAgentsCommand = vscode.commands.registerCommand('kfc.spec.createWithAgents', async () => {
        try {
            await specManager.createWithAgents();
        } catch (error) {
            outputChannel.appendLine(`Error in createWithAgents: ${error}`);
            vscode.window.showErrorMessage(`Failed to create spec with agents: ${error}`);
        }
    });

    context.subscriptions.push(createSpecCommand, createSpecWithAgentsCommand);

    context.subscriptions.push(
        vscode.commands.registerCommand('kfc.spec.navigate.requirements', async (specName: string) => {
            await specManager.navigateToDocument(specName, 'requirements');
        }),

        vscode.commands.registerCommand('kfc.spec.navigate.design', async (specName: string) => {
            await specManager.navigateToDocument(specName, 'design');
        }),

        vscode.commands.registerCommand('kfc.spec.navigate.tasks', async (specName: string) => {
            await specManager.navigateToDocument(specName, 'tasks');
        }),

        vscode.commands.registerCommand('kfc.spec.implTask', async (documentUri: vscode.Uri, lineNumber: number, taskDescription: string) => {
            outputChannel.appendLine(`[Task Execute] Line ${lineNumber + 1}: ${taskDescription}`);

            // Update task status to completed
            const document = await vscode.workspace.openTextDocument(documentUri);
            const edit = new vscode.WorkspaceEdit();
            const line = document.lineAt(lineNumber);
            const newLine = line.text.replace('- [ ]', '- [x]');
            const range = new vscode.Range(lineNumber, 0, lineNumber, line.text.length);
            edit.replace(documentUri, range, newLine);
            await vscode.workspace.applyEdit(edit);

            // Use Codex CLI to execute task
            await specManager.implTask(documentUri.fsPath, taskDescription);
        }),
        vscode.commands.registerCommand('kfc.spec.refresh', async () => {
            outputChannel.appendLine('[Manual Refresh] Refreshing spec explorer...');
            specExplorer.refresh();
        })
    );

    // Steering commands
    context.subscriptions.push(
        vscode.commands.registerCommand('kfc.steering.create', async () => {
            await steeringManager.createCustom();
        }),

        vscode.commands.registerCommand('kfc.steering.generateInitial', async () => {
            await steeringManager.init();
        }),

        vscode.commands.registerCommand('kfc.steering.refine', async (item: any) => {
            // Item is always from tree view
            const uri = vscode.Uri.file(item.resourcePath);
            await steeringManager.refine(uri);
        }),

        vscode.commands.registerCommand('kfc.steering.delete', async (item: any) => {
            outputChannel.appendLine(`[Steering] Deleting: ${item.label}`);

            // Use SteeringManager to delete the document and update CLAUDE.md
            const result = await steeringManager.delete(item.label, item.resourcePath);

            if (!result.success && result.error) {
                vscode.window.showErrorMessage(result.error);
            }
        }),

        // Configuration commands
        vscode.commands.registerCommand('kfc.steering.createUserRule', async () => {
            await steeringManager.createUserConfiguration();
        }),

        vscode.commands.registerCommand('kfc.steering.createProjectRule', async () => {
            await steeringManager.createProjectDocumentation();
        }),

        vscode.commands.registerCommand('kfc.steering.refresh', async () => {
            outputChannel.appendLine('[Manual Refresh] Refreshing steering explorer...');
            steeringExplorer.refresh();
        }),

        // Agents commands
        vscode.commands.registerCommand('kfc.agents.refresh', async () => {
            outputChannel.appendLine('[Manual Refresh] Refreshing agents explorer...');
            agentsExplorer.refresh();
        })
    );

    // Add file save confirmation for agent files
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument(async (event) => {
            const document = event.document;
            const filePath = document.fileName;

            // Check if this is an agent file in .kiro or .claude directories
            if ((filePath.includes('.kiro/agents/') || filePath.includes('.claude/agents/')) && filePath.endsWith('.md')) {
                // Show confirmation dialog
                const result = await vscode.window.showWarningMessage(
                    'Are you sure you want to save changes to this agent file?',
                    { modal: true },
                    'Save',
                    'Cancel'
                );

                if (result !== 'Save') {
                    // Cancel the save operation by waiting forever
                    event.waitUntil(new Promise(() => { }));
                }
            }
        })
    );

    // Spec delete command
    context.subscriptions.push(
        vscode.commands.registerCommand('kfc.spec.delete', async (item: any) => {
            await specManager.delete(item.label);
        })
    );

    // Codex integration commands
    // (removed unused Claude Code specific commands)

    // Hooks commands
    context.subscriptions.push(
        vscode.commands.registerCommand('kfc.hooks.refresh', () => {
            hooksExplorer.refresh();
        }),

        vscode.commands.registerCommand('kfc.hooks.copyCommand', async (command: string) => {
            await vscode.env.clipboard.writeText(command);
        })
    );

    // MCP commands
    context.subscriptions.push(
        vscode.commands.registerCommand('kfc.mcp.refresh', () => {
            mcpExplorer.refresh();
        }),

        // Update checker command
        vscode.commands.registerCommand('kfc.checkForUpdates', async () => {
            outputChannel.appendLine('Manual update check requested');
            await updateChecker.checkForUpdates(true); // Force check
        }),

        // Overview and settings commands
        vscode.commands.registerCommand('kfc.settings.open', async () => {
            outputChannel.appendLine('Opening Kiro settings...');

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }

            // Create .kiro/settings directory if it doesn't exist
            const kiroDir = vscode.Uri.joinPath(workspaceFolder.uri, '.kiro');
            const settingsDir = vscode.Uri.joinPath(kiroDir, 'settings');

            try {
                await vscode.workspace.fs.createDirectory(kiroDir);
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
                    Buffer.from(JSON.stringify(defaultSettings, null, 2))
                );
            }

            // Open the settings file
            const document = await vscode.workspace.openTextDocument(settingsFile);
            await vscode.window.showTextDocument(document);
        }),

        vscode.commands.registerCommand('kfc.help.open', async () => {
            outputChannel.appendLine('Opening Kiro help...');
            const helpUrl = 'https://github.com/notdp/kiro-for-codex#readme';
            vscode.env.openExternal(vscode.Uri.parse(helpUrl));
        }),

        vscode.commands.registerCommand('kfc.menu.open', async () => {
            outputChannel.appendLine('Opening Kiro menu...');
            await toggleViews();
        }),

        // Codex availability check command
        vscode.commands.registerCommand('kfc.codex.checkAvailability', async () => {
            const availabilityResult = await codexProvider.getCodexAvailabilityStatus();

            const statusMessage = availabilityResult.isAvailable
                ? `✅ Codex CLI v${availabilityResult.version} is available and ready`
                : `❌ Codex CLI is not available: ${availabilityResult.errorMessage}`;

            vscode.window.showInformationMessage(statusMessage);

            outputChannel.appendLine(`[Codex Check] Available: ${availabilityResult.isAvailable}`);
            outputChannel.appendLine(`[Codex Check] Installed: ${availabilityResult.isInstalled}`);
            outputChannel.appendLine(`[Codex Check] Version: ${availabilityResult.version || 'Unknown'}`);
            outputChannel.appendLine(`[Codex Check] Compatible: ${availabilityResult.isCompatible}`);

            if (availabilityResult.errorMessage) {
                outputChannel.appendLine(`[Codex Check] Error: ${availabilityResult.errorMessage}`);
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
    hooksExplorer: HooksExplorerProvider,
    mcpExplorer: MCPExplorerProvider,
    agentsExplorer: AgentsExplorerProvider
) {
    // Watch for changes in .claude, .kiro, and .codex directories with debouncing
    const kfcWatcher = vscode.workspace.createFileSystemWatcher('**/.claude/**/*');
    const kiroWatcher = vscode.workspace.createFileSystemWatcher('**/.kiro/**/*');
    const codexWatcher = vscode.workspace.createFileSystemWatcher('**/.codex/**/*');

    let refreshTimeout: NodeJS.Timeout | undefined;
    const debouncedRefresh = (event: string, uri: vscode.Uri) => {
        outputChannel.appendLine(`[FileWatcher] ${event}: ${uri.fsPath}`);

        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }
        refreshTimeout = setTimeout(() => {
            specExplorer.refresh();
            steeringExplorer.refresh();
            hooksExplorer.refresh();
            mcpExplorer.refresh();
            agentsExplorer.refresh();
        }, 1000); // Increase debounce time to 1 second
    };

    kfcWatcher.onDidCreate((uri) => debouncedRefresh('Create', uri));
    kfcWatcher.onDidDelete((uri) => debouncedRefresh('Delete', uri));
    kfcWatcher.onDidChange((uri) => debouncedRefresh('Change', uri));

    kiroWatcher.onDidCreate((uri) => debouncedRefresh('Create', uri));
    kiroWatcher.onDidDelete((uri) => debouncedRefresh('Delete', uri));
    kiroWatcher.onDidChange((uri) => debouncedRefresh('Change', uri));

    codexWatcher.onDidCreate((uri) => debouncedRefresh('Create', uri));
    codexWatcher.onDidDelete((uri) => debouncedRefresh('Delete', uri));
    codexWatcher.onDidChange((uri) => debouncedRefresh('Change', uri));

    context.subscriptions.push(kfcWatcher, kiroWatcher, codexWatcher);

    // Watch for changes in Codex and Claude settings
    const claudeSettingsWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(process.env.HOME || '', '.claude/settings.json')
    );

    const kiroSettingsWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(process.env.HOME || '', '.kiro/settings.json')
    );

    claudeSettingsWatcher.onDidChange(() => {
        hooksExplorer.refresh();
        mcpExplorer.refresh();
    });

    kiroSettingsWatcher.onDidChange(() => {
        hooksExplorer.refresh();
        mcpExplorer.refresh();
    });

    context.subscriptions.push(claudeSettingsWatcher, kiroSettingsWatcher);

    // Watch for changes in CLAUDE.md files
    const globalClaudeMdWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(process.env.HOME || '', '.claude/CLAUDE.md')
    );
    const projectClaudeMdWatcher = vscode.workspace.createFileSystemWatcher('**/CLAUDE.md');

    globalClaudeMdWatcher.onDidCreate(() => steeringExplorer.refresh());
    globalClaudeMdWatcher.onDidDelete(() => steeringExplorer.refresh());
    projectClaudeMdWatcher.onDidCreate(() => steeringExplorer.refresh());
    projectClaudeMdWatcher.onDidDelete(() => steeringExplorer.refresh());

    context.subscriptions.push(globalClaudeMdWatcher, projectClaudeMdWatcher);
}

export function deactivate() {
    // Cleanup Codex provider resources
    if (codexProvider) {
        codexProvider.cancelAllRetries();
    }
}