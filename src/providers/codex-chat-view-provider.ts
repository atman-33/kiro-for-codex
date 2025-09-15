import * as vscode from "vscode";
import type { ChatManager } from "../features/codex-chat/chat-manager";
import type {
	InboundWebviewMessage,
	OutboundWebviewMessage,
} from "../types/codex-chat-types";
import { IPC } from "../types/ipc/codex-chat-events";

/**
 * WebviewView provider to host Codex Chat inside the sidebar (kiroCodex view container).
 */
export class CodexChatViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewId = "kiroCodex.views.codexChat";

	private view?: vscode.WebviewView;
	private currentCancel: (() => void) | undefined;
	private currentId: string | undefined;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly chatManager: ChatManager,
	) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void | Thenable<void> {
		this.view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(
					this.context.extensionUri,
					"dist",
					"webview",
					"app",
				),
			],
		};
		// Preserve state when hidden to keep message history
		// @ts-expect-error VS Code allows this on webview
		webviewView.webview.retainContextWhenHidden = true;

		webviewView.webview.html = getHtml(this.context, webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			async (msg: InboundWebviewMessage) => {
				try {
					if (!msg || typeof msg !== "object" || !("type" in msg)) return;
					switch (msg.type) {
						case IPC.Echo: {
							const response: OutboundWebviewMessage = {
								type: IPC.EchoResult,
								id: msg.id,
								text: msg.text,
								ts: Date.now(),
							};
							webviewView.webview.postMessage(response);
							break;
						}
						case IPC.RunOnce: {
							const out = await this.chatManager.runOnce(msg.text);
							const response: OutboundWebviewMessage = {
								type: IPC.Complete,
								id: msg.id,
								text: out,
								ts: Date.now(),
							};
							webviewView.webview.postMessage(response);
							break;
						}
						case IPC.RunStream: {
							// Route to Codex terminal session (Proposal 1)
							let ack = "";
							try {
								const result = await this.chatManager.ensureTerminalOrSend(
									msg.text,
									"Codex Chat",
								);
								ack =
									result === "started"
										? "Opened Codex terminal. Conversation continues there."
										: "Sent to Codex terminal.";
							} catch (err) {
								const response: OutboundWebviewMessage = {
									type: IPC.Error,
									id: msg.id,
									error: err instanceof Error ? err.message : String(err),
									ts: Date.now(),
								};
								webviewView.webview.postMessage(response);
								break;
							}

							// Send lightweight completion to unlock the input UI
							{
								const response: OutboundWebviewMessage = {
									type: IPC.Complete,
									id: msg.id,
									text: ack,
									ts: Date.now(),
								};
								webviewView.webview.postMessage(response);
							}
							break;
						}
						case IPC.Stop: {
							// Stop Codex terminal session
							this.chatManager.stopTerminalSession();
							break;
						}
						default:
							break;
					}
				} catch (e) {
					const response: OutboundWebviewMessage = {
						type: IPC.Error,
						id: (msg as any)?.id ?? "unknown",
						error: e instanceof Error ? e.message : String(e),
						ts: Date.now(),
					};
					webviewView.webview.postMessage(response);
				}
			},
		);
	}
}

function getHtml(context: vscode.ExtensionContext, webview: vscode.Webview) {
	const base = vscode.Uri.joinPath(
		context.extensionUri,
		"dist",
		"webview",
		"app",
	);

	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(base, "index.js"));
	const cssUri = webview.asWebviewUri(
		vscode.Uri.joinPath(base, "assets", "index.css"),
	);

	const nonce = getNonce();
	const csp = [
		"default-src 'none'",
		`img-src ${webview.cspSource} data: blob:`,
		`style-src 'unsafe-inline' ${webview.cspSource}`,
		`font-src ${webview.cspSource}`,
		`script-src 'nonce-${nonce}' ${webview.cspSource}`,
	].join("; ");

	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="Content-Security-Policy" content="${csp}">
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Codex Chat</title>
		<link rel="stylesheet" href="${cssUri}">
		<style>
			:root { color-scheme: light dark; }
			html, body, #root { height: 100%; width: 100%; margin: 0; }
			body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
		</style>
	</head>
	<body>
		<div id="root" data-page="codex-chat"></div>
		<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
	</body>
</html>`;
}

function getNonce() {
	let text = "";
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
