import * as vscode from 'vscode';
import { CodexAvailabilityResult } from '../providers/codex-provider';

/**
 * Service for managing Codex CLI setup and installation guidance
 */
export class CodexSetupService {
  private static instance: CodexSetupService;
  private outputChannel: vscode.OutputChannel;

  private constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  public static getInstance(outputChannel?: vscode.OutputChannel): CodexSetupService {
    if (!CodexSetupService.instance) {
      if (!outputChannel) {
        throw new Error('OutputChannel is required for first initialization');
      }
      CodexSetupService.instance = new CodexSetupService(outputChannel);
    }
    return CodexSetupService.instance;
  }

  /**
   * Show comprehensive setup guidance based on availability result
   */
  async showSetupGuidance(availabilityResult: CodexAvailabilityResult): Promise<void> {
    if (availabilityResult.isAvailable) {
      return; // No guidance needed if Codex is available
    }

    const message = availabilityResult.errorMessage || 'Codex CLI is not available';
    const guidance = availabilityResult.setupGuidance || this.getInstallationGuidance();

    this.outputChannel.appendLine(`[CodexSetupService] Showing setup guidance: ${message}`);

    // Show error message with action buttons
    const action = await vscode.window.showErrorMessage(
      message,
      'Show Setup Instructions',
      'Open Documentation',
      'Check System Requirements',
      'Retry Check'
    );

    switch (action) {
      case 'Show Setup Instructions':
        await this.showSetupInstructions(guidance);
        break;
      case 'Open Documentation':
        await vscode.env.openExternal(vscode.Uri.parse('https://docs.openai.com/codex-cli'));
        break;
      case 'Check System Requirements':
        await this.showSystemRequirements();
        break;
      case 'Retry Check':
        // This will be handled by the caller
        vscode.commands.executeCommand('kiro.checkCodexAvailability');
        break;
    }
  }

  /**
   * Show detailed setup instructions in a new document
   */
  private async showSetupInstructions(guidance: string): Promise<void> {
    const doc = await vscode.workspace.openTextDocument({
      content: guidance,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  /**
   * Show system requirements information
   */
  private async showSystemRequirements(): Promise<void> {
    const requirements = this.getSystemRequirements();
    const doc = await vscode.workspace.openTextDocument({
      content: requirements,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  /**
   * Get installation guidance for Codex CLI
   */
  getInstallationGuidance(): string {
    return `# Codex CLI Installation Guide

## Quick Installation

### Option 1: Install via npm (Recommended)
\`\`\`bash
npm install -g @openai/codex-cli
\`\`\`

### Option 2: Install via pip
\`\`\`bash
pip install codex-cli
\`\`\`

### Option 3: Download Binary
1. Visit [GitHub Releases](https://github.com/openai/codex-cli/releases)
2. Download the latest release for your platform
3. Extract and add to your PATH

## Post-Installation Setup

### 1. Verify Installation
\`\`\`bash
codex --version
\`\`\`

### 2. Configure Authentication
\`\`\`bash
codex auth login
\`\`\`

### 3. Test Basic Functionality
\`\`\`bash
codex --help
\`\`\`

## Configuration in Kiro

After installing Codex CLI, you can configure it in VS Code settings:

1. Open VS Code Settings (Ctrl/Cmd + ,)
2. Search for "kiro codex"
3. Configure the following options:
   - **Codex Path**: Path to the codex executable (default: "codex")
   - **Default Approval Mode**: How Codex should handle code changes
   - **Default Model**: AI model to use (default: "gpt-5")
   - **Timeout**: Maximum execution time in milliseconds

## Troubleshooting

If you encounter issues, try:

1. **Check PATH**: Ensure codex is in your system PATH
2. **Permissions**: Make sure you have execute permissions
3. **Network**: Verify internet connectivity for authentication
4. **Logs**: Check the Kiro output channel for detailed error messages

For more help, visit: https://docs.openai.com/codex-cli/installation`;
  }

  /**
   * Get system requirements information
   */
  private getSystemRequirements(): string {
    return `# Codex CLI System Requirements

## Minimum Requirements

### Operating System
- **Windows**: Windows 10 or later
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Ubuntu 18.04+ or equivalent

### Runtime Requirements

#### For npm Installation
- **Node.js**: Version 16.0 or later
- **npm**: Version 7.0 or later

#### For pip Installation
- **Python**: Version 3.8 or later
- **pip**: Latest version recommended

### Hardware Requirements
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 500MB free space
- **Network**: Internet connection for authentication and API calls

### Additional Requirements
- **OpenAI API Key**: Required for authentication
- **Terminal/Command Line**: Access to command line interface

## Checking Your System

### Check Node.js Version
\`\`\`bash
node --version
npm --version
\`\`\`

### Check Python Version
\`\`\`bash
python --version
pip --version
\`\`\`

### Check Available Space
\`\`\`bash
# On Unix-like systems
df -h

# On Windows
dir
\`\`\`

## Platform-Specific Notes

### Windows
- Use PowerShell or Command Prompt
- May require running as Administrator for global installations
- Windows Defender might flag the executable (add exception if needed)

### macOS
- May require Xcode Command Line Tools
- Use Terminal.app or iTerm2
- Gatekeeper might block unsigned binaries (use \`xattr -d com.apple.quarantine\`)

### Linux
- Ensure you have build tools installed (\`build-essential\` on Ubuntu)
- May need to use \`sudo\` for global npm installations
- Check that your user has appropriate permissions

## Getting Help

If your system doesn't meet these requirements:

1. **Update your system**: Install the latest OS updates
2. **Install missing dependencies**: Follow platform-specific guides
3. **Contact support**: Visit the Codex CLI documentation for help

For detailed installation guides, visit: https://docs.openai.com/codex-cli/system-requirements`;
  }

  /**
   * Get version upgrade guidance
   */
  getVersionUpgradeGuidance(currentVersion: string, requiredVersion: string): string {
    return `# Codex CLI Version Update Required

Your current Codex CLI version (${currentVersion}) is outdated. 
Please upgrade to version ${requiredVersion} or later.

## Update Instructions

### If installed via npm:
\`\`\`bash
npm update -g @openai/codex-cli
\`\`\`

### If installed via pip:
\`\`\`bash
pip install --upgrade codex-cli
\`\`\`

### If installed manually:
1. Download the latest version from [GitHub Releases](https://github.com/openai/codex-cli/releases)
2. Replace your existing installation
3. Verify the update: \`codex --version\`

## Verify Update
After updating, verify the installation:
\`\`\`bash
codex --version
\`\`\`

The output should show version ${requiredVersion} or later.

## What's New
Check the [changelog](https://github.com/openai/codex-cli/releases) to see what improvements and bug fixes are included in the latest version.

For more information, visit: https://docs.openai.com/codex-cli/updating`;
  }

  /**
   * Get permission guidance for Codex CLI
   */
  getPermissionGuidance(): string {
    return `# Codex CLI Permission Issues

Permission denied when executing Codex CLI. Here's how to fix it:

## Check Current Permissions
\`\`\`bash
# Find codex location
which codex

# Check permissions
ls -la $(which codex)
\`\`\`

## Fix Permission Issues

### On macOS/Linux:
\`\`\`bash
# Make executable
chmod +x $(which codex)

# If globally installed via npm and having issues:
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
\`\`\`

### On Windows:
1. Run Command Prompt or PowerShell as Administrator
2. Try the installation/execution again
3. Check Windows Defender exclusions

## Alternative Solutions

### Reinstall with proper permissions:
\`\`\`bash
# Uninstall first
npm uninstall -g @openai/codex-cli

# Reinstall (may need sudo on macOS/Linux)
npm install -g @openai/codex-cli
\`\`\`

### Use npx (temporary solution):
\`\`\`bash
npx @openai/codex-cli --version
\`\`\`

## Check PATH Configuration
\`\`\`bash
echo $PATH
which codex
\`\`\`

If codex is not in PATH, add the installation directory to your PATH environment variable.

## Still Having Issues?

1. **Check your user permissions**: Ensure you have the right to execute files
2. **Try a different installation method**: Switch between npm, pip, or manual installation
3. **Contact your system administrator**: If on a managed system, you may need admin help

For more help, visit: https://docs.openai.com/codex-cli/troubleshooting#permissions`;
  }

  /**
   * Get general troubleshooting guidance
   */
  getTroubleshootingGuidance(): string {
    return `# Codex CLI Troubleshooting Guide

## Common Issues and Solutions

### 1. Command Not Found
**Error**: \`codex: command not found\`

**Solutions**:
- Verify installation: \`npm list -g @openai/codex-cli\`
- Check PATH: \`echo $PATH\`
- Reinstall: \`npm install -g @openai/codex-cli\`

### 2. Authentication Issues
**Error**: Authentication failed or API key issues

**Solutions**:
- Login again: \`codex auth login\`
- Check API key: \`codex auth status\`
- Verify network connectivity

### 3. Permission Denied
**Error**: Permission denied when executing

**Solutions**:
- Fix permissions: \`chmod +x $(which codex)\`
- Run as administrator (Windows)
- Check file ownership

### 4. Version Compatibility
**Error**: Incompatible version

**Solutions**:
- Update Codex CLI: \`npm update -g @openai/codex-cli\`
- Check version: \`codex --version\`
- Verify requirements

## Diagnostic Commands

Run these commands to gather diagnostic information:

\`\`\`bash
# System information
uname -a                    # OS information
node --version             # Node.js version
npm --version              # npm version
python --version           # Python version

# Codex CLI information
codex --version            # Codex version
codex --help               # Available commands
codex auth status          # Authentication status

# Installation information
which codex                # Codex location
npm list -g @openai/codex-cli  # npm installation info
pip show codex-cli         # pip installation info (if applicable)

# Environment
echo $PATH                 # PATH variable
env | grep -i codex        # Codex-related environment variables
\`\`\`

## Getting Help

### 1. Check Logs
- VS Code Developer Console: Help > Toggle Developer Tools
- Kiro Output Channel: View > Output > Select "Kiro"

### 2. Community Support
- GitHub Issues: https://github.com/openai/codex-cli/issues
- OpenAI Community: https://community.openai.com/

### 3. Documentation
- Official Docs: https://docs.openai.com/codex-cli
- API Reference: https://docs.openai.com/api-reference

## Reporting Issues

When reporting issues, please include:

1. **System Information**: OS, Node.js/Python version
2. **Codex CLI Version**: Output of \`codex --version\`
3. **Error Messages**: Complete error output
4. **Steps to Reproduce**: What you were trying to do
5. **Diagnostic Output**: Results of diagnostic commands above

This information helps maintainers quickly identify and resolve issues.`;
  }
}
