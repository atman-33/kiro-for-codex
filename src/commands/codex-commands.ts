import * as vscode from "vscode";
import type { CodexProvider } from "../providers/codex-provider";

/**
 * Commands related to Codex CLI functionality
 */
export class CodexCommands {
	private codexProvider: CodexProvider;

	constructor(codexProvider: CodexProvider) {
		this.codexProvider = codexProvider;
	}

	/**
	 * Register all Codex-related commands
	 */
	static registerCommands(
		context: vscode.ExtensionContext,
		codexProvider: CodexProvider,
	): void {
		const commands = new CodexCommands(codexProvider);

		const disposables = [
			vscode.commands.registerCommand("kiro.checkCodexAvailability", () =>
				commands.checkCodexAvailability(),
			),
			vscode.commands.registerCommand("kiro.showCodexSetupGuide", () =>
				commands.showCodexSetupGuide(),
			),
			vscode.commands.registerCommand("kiro.testCodexConnection", () =>
				commands.testCodexConnection(),
			),
		];

		context.subscriptions.push(...disposables);
	}

	/**
	 * Check Codex CLI availability and show results
	 */
	async checkCodexAvailability(): Promise<void> {
		try {
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: "Checking Codex CLI availability...",
					cancellable: false,
				},
				async (progress) => {
					progress.report({
						increment: 0,
						message: "Detecting Codex CLI installation...",
					});

					const result = await this.codexProvider.getCodexAvailabilityStatus();

					progress.report({
						increment: 50,
						message: "Checking version compatibility...",
					});

					// Small delay to show progress
					await new Promise((resolve) => setTimeout(resolve, 500));

					progress.report({ increment: 100, message: "Complete" });

					if (result.isAvailable) {
						vscode.window
							.showInformationMessage(
								`✅ Codex CLI is available and ready! Version: ${result.version}`,
								"Show Configuration",
							)
							.then((action) => {
								if (action === "Show Configuration") {
									vscode.commands.executeCommand(
										"workbench.action.openSettings",
										"kiro.codex",
									);
								}
							});
					} else {
						await this.codexProvider.showSetupGuidance(result);
					}
				},
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(
				`Failed to check Codex availability: ${errorMessage}`,
			);
		}
	}

	/**
	 * Show Codex setup guide regardless of current status
	 */
	async showCodexSetupGuide(): Promise<void> {
		try {
			const result = await this.codexProvider.getCodexAvailabilityStatus();
			await this.codexProvider.showSetupGuidance(result);
		} catch (error) {
			// Even if we can't check status, show basic setup guidance
			const basicResult = {
				isAvailable: false,
				isInstalled: false,
				version: null,
				isCompatible: false,
				errorMessage: "Unable to check Codex CLI status",
				setupGuidance: null,
			};
			await this.codexProvider.showSetupGuidance(basicResult);
		}
	}

	/**
	 * Test Codex connection with a simple command
	 */
	async testCodexConnection(): Promise<void> {
		try {
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: "Testing Codex CLI connection...",
					cancellable: true,
				},
				async (progress, token) => {
					progress.report({
						increment: 0,
						message: "Checking availability...",
					});

					const isReady = await this.codexProvider.isCodexReady();

					if (!isReady) {
						throw new Error(
							"Codex CLI is not available. Please check your installation.",
						);
					}

					progress.report({
						increment: 30,
						message: "Testing basic functionality...",
					});

					if (token.isCancellationRequested) {
						return;
					}

					// Test with a simple help command
					const testResult = await this.codexProvider.executeCodex("--help", {
						timeout: 10000,
					});

					progress.report({ increment: 70, message: "Verifying response..." });

					if (testResult.exitCode === 0) {
						progress.report({
							increment: 100,
							message: "Connection successful!",
						});

						vscode.window
							.showInformationMessage(
								"✅ Codex CLI connection test successful!",
								"View Configuration",
								"Run Sample Command",
							)
							.then((action) => {
								switch (action) {
									case "View Configuration":
										vscode.commands.executeCommand(
											"workbench.action.openSettings",
											"kiro.codex",
										);
										break;
									case "Run Sample Command":
										this.runSampleCommand();
										break;
								}
							});
					} else {
						throw new Error(
							`Codex CLI test failed with exit code ${testResult.exitCode}: ${testResult.error}`,
						);
					}
				},
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			vscode.window
				.showErrorMessage(
					`Codex CLI connection test failed: ${errorMessage}`,
					"Show Setup Guide",
					"Check Configuration",
				)
				.then((action) => {
					switch (action) {
						case "Show Setup Guide":
							this.showCodexSetupGuide();
							break;
						case "Check Configuration":
							vscode.commands.executeCommand(
								"workbench.action.openSettings",
								"kiro.codex",
							);
							break;
					}
				});
		}
	}

	/**
	 * Run a sample Codex command to demonstrate functionality
	 */
	private async runSampleCommand(): Promise<void> {
		try {
			const samplePrompt = `# Sample Codex Test

Please create a simple "Hello, World!" function in JavaScript.

Requirements:
- Function should be named \`sayHello\`
- Should accept a name parameter
- Should return a greeting string
- Include JSDoc comments`;

			await this.codexProvider.invokeCodexSplitView(
				samplePrompt,
				"Codex Sample Test",
			);

			vscode.window.showInformationMessage(
				"Sample Codex command started! Check the terminal on the right for results.",
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(
				`Failed to run sample command: ${errorMessage}`,
			);
		}
	}
}
