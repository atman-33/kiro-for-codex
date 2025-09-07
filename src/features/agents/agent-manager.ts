import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { ApprovalMode, CodexProvider } from '../../providers/codex-provider';
import { PromptLoader } from '../../services/prompt-loader';
import { NotificationUtils } from '../../utils/notification-utils';

export interface AgentInfo {
    name: string;
    description: string;
    path: string;
    type: 'project' | 'user';
    tools?: string[];
}

export interface AgentExecutionOptions {
    approvalMode?: ApprovalMode;
    workingDirectory?: string;
    timeout?: number;
    parameters?: Record<string, any>;
}

export interface AgentExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    terminal?: vscode.Terminal;
}

export class AgentManager {
    private outputChannel: vscode.OutputChannel;
    private extensionPath: string;
    private workspaceRoot: string | undefined;
    private codexProvider: CodexProvider;
    private promptLoader: PromptLoader;

    private readonly BUILT_IN_AGENTS = [
        'spec-requirements',
        'spec-design',
        'spec-tasks',
        'spec-system-prompt-loader',
        'spec-judge',
        'spec-impl',
        'spec-test'
    ];

    constructor(
        context: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel,
        codexProvider: CodexProvider
    ) {
        this.outputChannel = outputChannel;
        this.extensionPath = context.extensionPath;
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        this.codexProvider = codexProvider;
        this.promptLoader = PromptLoader.getInstance();
    }

    /**
     * Initialize built-in agents (copy if not exist on startup)
     */
    async initializeBuiltInAgents(): Promise<void> {
        if (!this.workspaceRoot) {
            this.outputChannel.appendLine('[AgentManager] No workspace root found, skipping agent initialization');
            return;
        }

        const targetDir = path.join(this.workspaceRoot, '.codex/agents/kfc');

        try {
            // Ensure target directory exists
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir));

            // Copy each built-in agent (always overwrite to ensure latest version)
            for (const agentName of this.BUILT_IN_AGENTS) {
                const sourcePath = path.join(this.extensionPath, 'dist/resources/agents', `${agentName}.md`);
                const targetPath = path.join(targetDir, `${agentName}.md`);

                try {
                    const sourceUri = vscode.Uri.file(sourcePath);
                    const targetUri = vscode.Uri.file(targetPath);
                    await vscode.workspace.fs.copy(sourceUri, targetUri, { overwrite: true });
                    this.outputChannel.appendLine(`[AgentManager] Updated agent ${agentName}`);
                } catch (error) {
                    this.outputChannel.appendLine(`[AgentManager] Failed to copy agent ${agentName}: ${error}`);
                }
            }

            // Also copy system prompt if it doesn't exist
            await this.initializeSystemPrompt();

        } catch (error) {
            this.outputChannel.appendLine(`[AgentManager] Failed to initialize agents: ${error}`);
        }
    }

    /**
     * Initialize system prompt (copy if not exist)
     */
    private async initializeSystemPrompt(): Promise<void> {
        if (!this.workspaceRoot) {
            return;
        }

        const systemPromptDir = path.join(this.workspaceRoot, '.codex/system-prompts');
        const sourcePath = path.join(this.extensionPath, 'dist/resources/prompts', 'spec-workflow-starter.md');
        const targetPath = path.join(systemPromptDir, 'spec-workflow-starter.md');

        try {
            // Ensure directory exists
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(systemPromptDir));

            // Always overwrite to ensure latest version
            await vscode.workspace.fs.copy(vscode.Uri.file(sourcePath), vscode.Uri.file(targetPath), { overwrite: true });
            this.outputChannel.appendLine('[AgentManager] Updated system prompt');
        } catch (error) {
            this.outputChannel.appendLine(`[AgentManager] Failed to initialize system prompt: ${error}`);
        }
    }

    /**
     * Get list of agents
     */
    async getAgentList(type: 'project' | 'user' | 'all' = 'all'): Promise<AgentInfo[]> {
        const agents: AgentInfo[] = [];

        // Get project agents (excluding kfc built-in agents)
        if (type === 'project' || type === 'all') {
            if (this.workspaceRoot) {
                const projectAgentsPath = path.join(this.workspaceRoot, '.codex/agents');
                const projectAgents = await this.getAgentsFromDirectory(
                    projectAgentsPath,
                    'project',
                    true  // exclude kfc directory
                );
                agents.push(...projectAgents);
            }
        }

        // Get user agents
        if (type === 'user' || type === 'all') {
            const userAgentsPath = path.join(os.homedir(), '.codex/agents');
            const userAgents = await this.getAgentsFromDirectory(userAgentsPath, 'user');
            agents.push(...userAgents);
        }

        return agents;
    }

    /**
     * Get agents from a specific directory (including subdirectories)
     */
    private async getAgentsFromDirectory(dirPath: string, type: 'project' | 'user', excludeKfc: boolean = false): Promise<AgentInfo[]> {
        const agents: AgentInfo[] = [];

        try {
            this.outputChannel.appendLine(`[AgentManager] Reading agents from directory: ${dirPath}`);
            await this.readAgentsRecursively(dirPath, type, agents, excludeKfc);
            this.outputChannel.appendLine(`[AgentManager] Total agents found in ${dirPath}: ${agents.length}`);
        } catch (error) {
            this.outputChannel.appendLine(`[AgentManager] Failed to read agents from ${dirPath}: ${error}`);
        }

        return agents;
    }

    /**
     * Recursively read agents from directory and subdirectories
     */
    private async readAgentsRecursively(dirPath: string, type: 'project' | 'user', agents: AgentInfo[], excludeKfc: boolean = false): Promise<void> {
        try {
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));

            for (const [fileName, fileType] of entries) {
                const fullPath = path.join(dirPath, fileName);

                // Skip kfc directory if excludeKfc is true
                if (excludeKfc && fileName === 'kfc' && fileType === vscode.FileType.Directory) {
                    this.outputChannel.appendLine(`[AgentManager] Skipping kfc directory (built-in agents)`);
                    continue;
                }

                if (fileType === vscode.FileType.File && fileName.endsWith('.md')) {
                    this.outputChannel.appendLine(`[AgentManager] Processing agent file: ${fileName}`);
                    const agentInfo = await this.parseAgentFile(fullPath, type);
                    if (agentInfo) {
                        agents.push(agentInfo);
                        this.outputChannel.appendLine(`[AgentManager] Added agent: ${agentInfo.name}`);
                    } else {
                        this.outputChannel.appendLine(`[AgentManager] Failed to parse agent: ${fileName}`);
                    }
                } else if (fileType === vscode.FileType.Directory) {
                    // Recursively read subdirectories
                    this.outputChannel.appendLine(`[AgentManager] Entering subdirectory: ${fileName}`);
                    await this.readAgentsRecursively(fullPath, type, agents, excludeKfc);
                }
            }
        } catch (error) {
            this.outputChannel.appendLine(`[AgentManager] Error reading directory ${dirPath}: ${error}`);
        }
    }

    /**
     * Parse agent file and extract metadata
     */
    private async parseAgentFile(filePath: string, type: 'project' | 'user'): Promise<AgentInfo | null> {
        try {
            this.outputChannel.appendLine(`[AgentManager] Parsing agent file: ${filePath}`);
            const content = await fs.promises.readFile(filePath, 'utf8');

            // Extract YAML frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) {
                this.outputChannel.appendLine(`[AgentManager] No frontmatter found in: ${filePath}`);
                return null;
            }

            let frontmatter: any;
            try {
                // Debug: log the frontmatter content for spec-system-prompt-loader
                if (path.basename(filePath) === 'spec-system-prompt-loader.md') {
                    this.outputChannel.appendLine(`[AgentManager] Frontmatter content for spec-system-prompt-loader:`);
                    this.outputChannel.appendLine(frontmatterMatch[1]);
                }

                frontmatter = yaml.load(frontmatterMatch[1]) as any;
                this.outputChannel.appendLine(`[AgentManager] Successfully parsed YAML for: ${path.basename(filePath)}`);
            } catch (yamlError) {
                this.outputChannel.appendLine(`[AgentManager] YAML parse error in ${path.basename(filePath)}: ${yamlError}`);
                if (path.basename(filePath) === 'spec-system-prompt-loader.md') {
                    this.outputChannel.appendLine(`[AgentManager] Raw frontmatter that failed:`);
                    this.outputChannel.appendLine(frontmatterMatch[1]);
                }
                return null;
            }

            return {
                name: frontmatter.name || path.basename(filePath, '.md'),
                description: frontmatter.description || '',
                path: filePath,
                type,
                tools: Array.isArray(frontmatter.tools)
                    ? frontmatter.tools
                    : (frontmatter.tools ? frontmatter.tools.split(',').map((t: string) => t.trim()) : undefined)
            };
        } catch (error) {
            this.outputChannel.appendLine(`[AgentManager] Failed to parse agent file ${filePath}: ${error}`);
            return null;
        }
    }

    /**
     * Check if agent exists
     */
    checkAgentExists(agentName: string, location: 'project' | 'user'): boolean {
        const basePath = location === 'project'
            ? (this.workspaceRoot ? path.join(this.workspaceRoot, '.codex/agents/kfc') : null)
            : path.join(os.homedir(), '.codex/agents');

        if (!basePath) {
            return false;
        }

        const agentPath = path.join(basePath, `${agentName}.md`);
        return fs.existsSync(agentPath);
    }

    /**
     * Get agent file path
     */
    getAgentPath(agentName: string): string | null {
        // Check project agents first
        if (this.workspaceRoot) {
            const projectPath = path.join(this.workspaceRoot, '.codex/agents/kfc', `${agentName}.md`);
            if (fs.existsSync(projectPath)) {
                return projectPath;
            }
        }

        // Check user agents
        const userPath = path.join(os.homedir(), '.codex/agents', `${agentName}.md`);
        if (fs.existsSync(userPath)) {
            return userPath;
        }

        return null;
    }

    /**
     * Execute an agent using Codex CLI
     */
    async executeAgent(
        agentName: string,
        parameters: Record<string, any> = {},
        options: AgentExecutionOptions = {}
    ): Promise<AgentExecutionResult> {
        // Check Codex CLI availability first
        const isCodexReady = await this.codexProvider.isCodexReady();
        if (!isCodexReady) {
            const availabilityResult = await this.codexProvider.getCodexAvailabilityStatus();
            await this.codexProvider.showSetupGuidance(availabilityResult);
            return {
                success: false,
                error: 'Codex CLI is not available. Please ensure it is installed and accessible.'
            };
        }

        // Find the agent
        const agentPath = this.getAgentPath(agentName);
        if (!agentPath) {
            const error = `Agent '${agentName}' not found`;
            this.outputChannel.appendLine(`[AgentManager] ${error}`);
            return { success: false, error };
        }

        try {
            // Load agent content
            const agentContent = await fs.promises.readFile(agentPath, 'utf8');

            // Parse agent metadata
            const agentInfo = await this.parseAgentFile(agentPath, 'project');
            if (!agentInfo) {
                const error = `Failed to parse agent '${agentName}'`;
                this.outputChannel.appendLine(`[AgentManager] ${error}`);
                return { success: false, error };
            }

            // Prepare the prompt by combining agent content with parameters
            const prompt = this.buildAgentPrompt(agentContent, parameters);

            // Set approval mode if provided
            if (options.approvalMode) {
                this.codexProvider.setApprovalMode(options.approvalMode);
            }

            // Show notification
            NotificationUtils.showAutoDismissNotification(`Executing agent '${agentInfo.name}'. Check the terminal for progress.`);

            // Execute using Codex CLI
            const terminal = await this.codexProvider.invokeCodexSplitView(
                prompt,
                `Codex - Agent: ${agentInfo.name}`
            );

            this.outputChannel.appendLine(`[AgentManager] Successfully executed agent '${agentName}'`);

            return {
                success: true,
                terminal
            };

        } catch (error) {
            const errorMessage = `Failed to execute agent '${agentName}': ${error}`;
            this.outputChannel.appendLine(`[AgentManager] ${errorMessage}`);
            vscode.window.showErrorMessage(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Execute an agent in headless mode (background execution)
     */
    async executeAgentHeadless(
        agentName: string,
        parameters: Record<string, any> = {},
        options: AgentExecutionOptions = {}
    ): Promise<AgentExecutionResult> {
        // Check Codex CLI availability first
        const isCodexReady = await this.codexProvider.isCodexReady();
        if (!isCodexReady) {
            const availabilityResult = await this.codexProvider.getCodexAvailabilityStatus();
            await this.codexProvider.showSetupGuidance(availabilityResult);
            return {
                success: false,
                error: 'Codex CLI is not available. Please ensure it is installed and accessible.'
            };
        }

        // Find the agent
        const agentPath = this.getAgentPath(agentName);
        if (!agentPath) {
            const error = `Agent '${agentName}' not found`;
            this.outputChannel.appendLine(`[AgentManager] ${error}`);
            return { success: false, error };
        }

        try {
            // Load agent content
            const agentContent = await fs.promises.readFile(agentPath, 'utf8');

            // Parse agent metadata
            const agentInfo = await this.parseAgentFile(agentPath, 'project');
            if (!agentInfo) {
                const error = `Failed to parse agent '${agentName}'`;
                this.outputChannel.appendLine(`[AgentManager] ${error}`);
                return { success: false, error };
            }

            // Prepare the prompt by combining agent content with parameters
            const prompt = this.buildAgentPrompt(agentContent, parameters);

            // Set approval mode if provided
            if (options.approvalMode) {
                this.codexProvider.setApprovalMode(options.approvalMode);
            }

            this.outputChannel.appendLine(`[AgentManager] Executing agent '${agentName}' in headless mode`);

            // Execute using Codex CLI in headless mode
            const result = await this.codexProvider.invokeCodexHeadless(prompt, {
                approvalMode: options.approvalMode,
                workingDirectory: options.workingDirectory,
                timeout: options.timeout
            });

            if (result.exitCode === 0) {
                this.outputChannel.appendLine(`[AgentManager] Successfully executed agent '${agentName}' in headless mode`);
                return {
                    success: true,
                    output: result.output
                };
            } else {
                const error = `Agent execution failed with exit code ${result.exitCode}: ${result.error}`;
                this.outputChannel.appendLine(`[AgentManager] ${error}`);
                return {
                    success: false,
                    error
                };
            }

        } catch (error) {
            const errorMessage = `Failed to execute agent '${agentName}' in headless mode: ${error}`;
            this.outputChannel.appendLine(`[AgentManager] ${errorMessage}`);

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Build agent prompt by combining agent content with parameters
     */
    private buildAgentPrompt(agentContent: string, parameters: Record<string, any>): string {
        let prompt = agentContent;

        // Replace parameter placeholders in the agent content
        for (const [key, value] of Object.entries(parameters)) {
            const placeholder = `{{${key}}}`;
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            prompt = prompt.replace(new RegExp(placeholder, 'g'), stringValue);
        }

        // Add parameters section if there are parameters
        if (Object.keys(parameters).length > 0) {
            prompt += '\n\n## Execution Parameters\n\n';
            for (const [key, value] of Object.entries(parameters)) {
                prompt += `- **${key}**: ${typeof value === 'string' ? value : JSON.stringify(value)}\n`;
            }
        }

        return prompt;
    }

    /**
     * Execute a spec-related agent with spec context
     */
    async executeSpecAgent(
        agentName: string,
        specName: string,
        taskType: 'create' | 'update' = 'create',
        additionalParameters: Record<string, any> = {}
    ): Promise<AgentExecutionResult> {
        if (!this.workspaceRoot) {
            const error = 'No workspace root found';
            this.outputChannel.appendLine(`[AgentManager] ${error}`);
            return { success: false, error };
        }

        // Build spec-specific parameters
        const specBasePath = path.join(this.workspaceRoot, '.codex/specs');
        const specPath = path.join(specBasePath, specName);

        const parameters = {
            spec_name: specName,
            spec_base_path: specBasePath,
            spec_path: specPath,
            task_type: taskType,
            working_directory: this.workspaceRoot,
            approval_mode: this.codexProvider.getCodexConfig().defaultApprovalMode,
            ...additionalParameters
        };

        return this.executeAgent(agentName, parameters, {
            workingDirectory: this.workspaceRoot,
            approvalMode: this.codexProvider.getCodexConfig().defaultApprovalMode
        });
    }

    /**
     * Get Codex CLI status for agent operations
     */
    async getCodexStatus(): Promise<{
        isReady: boolean;
        config: any;
        availabilityResult?: any;
    }> {
        const isReady = await this.codexProvider.isCodexReady();
        const config = this.codexProvider.getCodexConfig();

        if (!isReady) {
            const availabilityResult = await this.codexProvider.getCodexAvailabilityStatus();
            return { isReady, config, availabilityResult };
        }

        return { isReady, config };
    }

    /**
     * Set Codex approval mode for agent operations
     */
    setCodexApprovalMode(mode: ApprovalMode): void {
        this.codexProvider.setApprovalMode(mode);
        this.outputChannel.appendLine(`[AgentManager] Codex approval mode set to: ${mode}`);
    }

    /**
     * Check if a specific agent is available and ready for execution
     */
    async isAgentReady(agentName: string): Promise<boolean> {
        // Check if Codex CLI is ready
        const isCodexReady = await this.codexProvider.isCodexReady();
        if (!isCodexReady) {
            return false;
        }

        // Check if agent exists
        const agentPath = this.getAgentPath(agentName);
        return agentPath !== null;
    }

    /**
     * Get available built-in agents optimized for Codex CLI
     */
    getBuiltInAgents(): string[] {
        return [...this.BUILT_IN_AGENTS];
    }

    /**
     * Validate agent parameters against agent requirements
     */
    async validateAgentParameters(agentName: string, parameters: Record<string, any>): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const result = {
            isValid: true,
            errors: [] as string[],
            warnings: [] as string[]
        };

        try {
            const agentPath = this.getAgentPath(agentName);
            if (!agentPath) {
                result.isValid = false;
                result.errors.push(`Agent '${agentName}' not found`);
                return result;
            }

            const agentContent = await fs.promises.readFile(agentPath, 'utf8');

            // Extract required parameters from agent content
            const requiredParams = this.extractRequiredParameters(agentContent);

            // Check for missing required parameters
            for (const requiredParam of requiredParams) {
                if (!(requiredParam in parameters)) {
                    result.errors.push(`Missing required parameter: ${requiredParam}`);
                    result.isValid = false;
                }
            }

            // Check for unknown parameters (warnings only)
            const knownParams = this.extractAllParameters(agentContent);
            for (const param of Object.keys(parameters)) {
                if (!knownParams.includes(param)) {
                    result.warnings.push(`Unknown parameter: ${param}`);
                }
            }

        } catch (error) {
            result.isValid = false;
            result.errors.push(`Failed to validate parameters: ${error}`);
        }

        return result;
    }

    /**
     * Extract required parameters from agent content
     */
    private extractRequiredParameters(agentContent: string): string[] {
        const requiredParams: string[] = [];

        // Look for parameter definitions in the agent content
        const parameterSections = agentContent.match(/## Input Parameters[\s\S]*?(?=##|$)/g);

        if (parameterSections) {
            for (const section of parameterSections) {
                // Extract parameter names that are marked as required
                const paramMatches = section.match(/- \*\*(\w+)\*\*:/g);
                if (paramMatches) {
                    for (const match of paramMatches) {
                        const paramName = match.match(/\*\*(\w+)\*\*/)?.[1];
                        if (paramName) {
                            requiredParams.push(paramName);
                        }
                    }
                }
            }
        }

        return requiredParams;
    }

    /**
     * Extract all parameters from agent content
     */
    private extractAllParameters(agentContent: string): string[] {
        const allParams: string[] = [];

        // Look for parameter definitions and placeholder usage
        const parameterSections = agentContent.match(/## Input Parameters[\s\S]*?(?=##|$)/g);

        if (parameterSections) {
            for (const section of parameterSections) {
                const paramMatches = section.match(/- \*\*(\w+)\*\*:/g);
                if (paramMatches) {
                    for (const match of paramMatches) {
                        const paramName = match.match(/\*\*(\w+)\*\*/)?.[1];
                        if (paramName) {
                            allParams.push(paramName);
                        }
                    }
                }
            }
        }

        // Also look for placeholder usage {{parameter_name}}
        const placeholderMatches = agentContent.match(/\{\{(\w+)\}\}/g);
        if (placeholderMatches) {
            for (const match of placeholderMatches) {
                const paramName = match.match(/\{\{(\w+)\}\}/)?.[1];
                if (paramName && !allParams.includes(paramName)) {
                    allParams.push(paramName);
                }
            }
        }

        return allParams;
    }
}
