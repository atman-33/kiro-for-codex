import * as vscode from "vscode";
import type { CodexProvider } from "../../providers/codex-provider";

export class ChatManager {
	constructor(
		private readonly codex: CodexProvider,
		private readonly output: vscode.OutputChannel,
	) {}

	// --- Terminal conversation session (Proposal 1) ---
	private terminal?: vscode.Terminal;
	private terminalCloseSub?: vscode.Disposable;
	private readonly defaultTitle = "Codex Chat";

	/**
	 * Ensure a Codex terminal session exists and send the text.
	 * Returns "started" if a new terminal was created, otherwise "sent".
	 */
	async ensureTerminalOrSend(
		text: string,
		title?: string,
	): Promise<"started" | "sent"> {
		if (!this.terminal) {
			await this.startTerminalSession(text, title);
			return "started";
		}
		try {
			this.terminal.show(true);
			this.terminal.sendText(text, true);
			return "sent";
		} catch (e) {
			this.output.appendLine(
				`[ChatManager] Failed to send to terminal: ${e instanceof Error ? e.message : String(e)}`,
			);
			throw e;
		}
	}

	/**
	 * Start a new Codex terminal session with the initial text.
	 */
	async startTerminalSession(
		initialText: string,
		title?: string,
	): Promise<vscode.Terminal> {
		this.output.appendLine(
			`[ChatManager] Starting Codex terminal session (len=${initialText.length})`,
		);
		const terminal = await this.codex.invokeCodexSplitView(
			initialText,
			title ?? this.defaultTitle,
		);
		this.bindTerminal(terminal);
		return terminal;
	}

	/**
	 * Stop the active terminal session (dispose terminal).
	 */
	stopTerminalSession(): void {
		if (this.terminal) {
			this.output.appendLine(`[ChatManager] Disposing Codex terminal session`);
			try {
				this.terminal.dispose();
			} finally {
				this.cleanupTerminalBindings();
			}
		}
	}

	isTerminalActive(): boolean {
		return Boolean(this.terminal);
	}

	private bindTerminal(terminal: vscode.Terminal) {
		this.cleanupTerminalBindings();
		this.terminal = terminal;
		this.terminalCloseSub = vscode.window.onDidCloseTerminal((t) => {
			if (t === this.terminal) {
				this.output.appendLine(`[ChatManager] Codex terminal closed by user`);
				this.cleanupTerminalBindings();
			}
		});
	}

	private cleanupTerminalBindings() {
		try {
			this.terminalCloseSub?.dispose();
		} catch {}
		this.terminalCloseSub = undefined;
		this.terminal = undefined;
	}

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
