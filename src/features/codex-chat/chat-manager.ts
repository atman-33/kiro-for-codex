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

	async runStream(
		prompt: string,
		handlers: {
			onChunk?: (chunk: string) => void;
			onError?: (err: string) => void;
			onComplete?: (exitCode: number) => void;
		},
	): Promise<{ cancel: () => void }> {
		this.output.appendLine(`[ChatManager] runStream len=${prompt.length}`);
		try {
			const controller = await this.codex.executeCodexStream(
				prompt,
				undefined,
				{
					onStdout: (chunk) => handlers.onChunk?.(chunk),
					onStderr: (chunk) =>
						this.output.appendLine(`[ChatManager][stderr] ${chunk.trim()}`),
					onClose: (code) => handlers.onComplete?.(code),
				},
			);
			return { cancel: controller.cancel };
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			handlers.onError?.(msg);
			throw e;
		}
	}
}
