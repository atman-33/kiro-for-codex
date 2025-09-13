import type * as vscode from "vscode";
import type { CodexProvider } from "../../providers/codex-provider";

export class ChatManager {
	constructor(
		private readonly codex: CodexProvider,
		private readonly output: vscode.OutputChannel,
	) {}

	async runOnce(prompt: string): Promise<string> {
		this.output.appendLine(`[ChatManager] runOnce len=${prompt.length}`);
		const res = await this.codex.executeCodex(prompt);
		if (res.exitCode !== 0) {
			const msg = res.error || "Codex execution failed";
			throw new Error(msg);
		}
		return res.output || "";
	}
}
