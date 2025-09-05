import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { VSC_CONFIG_NAMESPACE } from '../constants';
import { CommandBuilder } from '../services/commandBuilder';
import { ProcessManager } from '../services/processManager';
import { ConfigManager } from '../utils/configManager';

export enum ApprovalMode {
  Interactive = 'interactive',
  AutoEdit = 'auto-edit',
  FullAuto = 'full-auto'
}

export interface CodexOptions {
  approvalMode?: ApprovalMode;
  workingDirectory?: string;
  timeout?: number;
  model?: string;
}

export interface CodexResult {
  exitCode: number;
  output?: string;
  error?: string;
  filesModified?: string[];
}

export interface CodexConfig {
  codexPath: string;
  defaultApprovalMode: ApprovalMode;
  defaultModel?: string;
  timeout: number;
  terminalDelay: number;
}

export class CodexProvider {
  private context: vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private configManager: ConfigManager;
  private commandBuilder: CommandBuilder;
  private processManager: ProcessManager;
  private codexConfig: CodexConfig;

  constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    this.context = context;
    this.outputChannel = outputChannel;
    this.configManager = ConfigManager.getInstance();
    this.commandBuilder = new CommandBuilder();
    this.processManager = new ProcessManager(outputChannel);

    // Initialize Codex configuration with defaults
    this.codexConfig = {
      codexPath: 'codex',
      defaultApprovalMode: ApprovalMode.Interactive,
      defaultModel: 'gpt-5',
      timeout: 30000,
      terminalDelay: 1000
    };

    this.configManager.loadSettings();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(VSC_CONFIG_NAMESPACE)) {
        this.configManager.loadSettings();
        this.loadCodexConfig();
      }
    });

    this.loadCodexConfig();
  }

  /**
   * Load Codex-specific configuration from workspace settings
   */
  private loadCodexConfig(): void {
    const config = vscode.workspace.getConfiguration(VSC_CONFIG_NAMESPACE);

    this.codexConfig = {
      codexPath: config.get('codex.path', 'codex'),
      defaultApprovalMode: config.get('codex.defaultApprovalMode', ApprovalMode.Interactive) as ApprovalMode,
      defaultModel: config.get('codex.defaultModel', 'gpt-5'),
      timeout: config.get('codex.timeout', 30000),
      terminalDelay: config.get('codex.terminalDelay', 1000)
    };
  }

  /**
   * Check if Codex CLI is available and properly configured
   */
  async checkCodexAvailability(): Promise<boolean> {
    try {
      const result = await this.processManager.executeCommand(`${this.codexConfig.codexPath} --version`);
      return result.exitCode === 0;
    } catch (error) {
      this.outputChannel.appendLine(`[CodexProvider] Codex CLI not available: ${error}`);
      return false;
    }
  }

  /**
   * Execute Codex CLI with the given prompt and options
   */
  async executeCodex(prompt: string, options?: CodexOptions): Promise<CodexResult> {
    const isAvailable = await this.checkCodexAvailability();
    if (!isAvailable) {
      throw new Error('Codex CLI is not available. Please ensure it is installed and accessible.');
    }

    try {
      // Create temporary file with the prompt
      const promptFilePath = await this.createTempFile(prompt, 'codex-prompt');

      // Build the command with options
      const command = this.commandBuilder.buildCommand(promptFilePath, {
        ...this.codexConfig,
        ...options
      });

      // Execute the command
      const workingDir = options?.workingDirectory || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const result = await this.processManager.executeCommand(command, workingDir);

      // Clean up temp file
      setTimeout(async () => {
        try {
          await fs.promises.unlink(promptFilePath);
          this.outputChannel.appendLine(`[CodexProvider] Cleaned up prompt file: ${promptFilePath}`);
        } catch (e) {
          this.outputChannel.appendLine(`[CodexProvider] Failed to cleanup temp file: ${e}`);
        }
      }, 5000);

      return {
        exitCode: result.exitCode,
        output: result.output,
        error: result.error,
        filesModified: [] // TODO: Parse output to detect modified files
      };

    } catch (error) {
      this.outputChannel.appendLine(`[CodexProvider] Error executing Codex: ${error}`);
      throw error;
    }
  }

  /**
   * Invoke Codex in a new terminal on the right side (split view)
   */
  async invokeCodexSplitView(prompt: string, title: string = 'Kiro for Codex'): Promise<vscode.Terminal> {
    const isAvailable = await this.checkCodexAvailability();
    if (!isAvailable) {
      throw new Error('Codex CLI is not available. Please ensure it is installed and accessible.');
    }

    try {
      // Create temp file with the prompt
      const promptFilePath = await this.createTempFile(prompt, 'codex-prompt');

      // Build the command
      const command = this.commandBuilder.buildCommand(promptFilePath, this.codexConfig);

      // Create terminal in split view
      const terminal = this.processManager.createTerminal(command, {
        name: title,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        location: { viewColumn: vscode.ViewColumn.Two }
      });

      // Clean up temp file after delay
      setTimeout(async () => {
        try {
          await fs.promises.unlink(promptFilePath);
          this.outputChannel.appendLine(`[CodexProvider] Cleaned up prompt file: ${promptFilePath}`);
        } catch (e) {
          this.outputChannel.appendLine(`[CodexProvider] Failed to cleanup temp file: ${e}`);
        }
      }, 30000);

      return terminal;

    } catch (error) {
      this.outputChannel.appendLine(`[CodexProvider] Error invoking Codex split view: ${error}`);
      vscode.window.showErrorMessage(`Failed to run Codex: ${error}`);
      throw error;
    }
  }

  /**
   * Execute Codex command in background (headless mode)
   */
  async invokeCodexHeadless(prompt: string, options?: CodexOptions): Promise<CodexResult> {
    this.outputChannel.appendLine(`[CodexProvider] Invoking Codex in headless mode`);
    this.outputChannel.appendLine(`========================================`);
    this.outputChannel.appendLine(prompt);
    this.outputChannel.appendLine(`========================================`);

    return this.executeCodex(prompt, options);
  }

  /**
   * Set the approval mode for Codex operations
   */
  setApprovalMode(mode: ApprovalMode): void {
    this.codexConfig.defaultApprovalMode = mode;
    this.outputChannel.appendLine(`[CodexProvider] Approval mode set to: ${mode}`);
  }

  /**
   * Rename a terminal
   */
  async renameTerminal(terminal: vscode.Terminal, newName: string): Promise<void> {
    terminal.show();
    await new Promise(resolve => setTimeout(resolve, 100));
    this.outputChannel.appendLine(`[CodexProvider] Terminal renamed to: ${newName}`);

    await vscode.commands.executeCommand('workbench.action.terminal.renameWithArg', {
      name: newName
    });
  }

  /**
   * Create a temporary file with content
   */
  private async createTempFile(content: string, prefix: string = 'codex'): Promise<string> {
    const tempDir = this.context.globalStorageUri.fsPath;
    await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);

    const tempFile = path.join(tempDir, `${prefix}-${Date.now()}.md`);
    await fs.promises.writeFile(tempFile, content);

    return this.convertPathIfWSL(tempFile);
  }

  /**
   * Convert Windows path to WSL path if needed
   */
  private convertPathIfWSL(filePath: string): string {
    if (process.platform === 'win32' && filePath.match(/^[A-Za-z]:\\/)) {
      let wslPath = filePath.replace(/\\/g, '/');
      wslPath = wslPath.replace(/^([A-Za-z]):/, (_match, drive) => `/mnt/${drive.toLowerCase()}`);
      return wslPath;
    }
    return filePath;
  }

  /**
   * Get current Codex configuration
   */
  getCodexConfig(): CodexConfig {
    return { ...this.codexConfig };
  }
}