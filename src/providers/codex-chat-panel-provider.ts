import * as vscode from "vscode";
import type { ChatManager } from "../features/codex-chat/chat-manager";
import type {
	InboundWebviewMessage,
	OutboundWebviewMessage,
} from "../types/codex-chat-types";
import { IPC } from "../types/ipc/codex-chat-events";

export namespace CodexChatPanelProvider {
	let panel: vscode.WebviewPanel | undefined;
	let chatManager: ChatManager | undefined;
	let currentCancel: (() => void) | undefined;
	let currentId: string | undefined;

	export function open(
		context: vscode.ExtensionContext,
		manager?: ChatManager,
	) {
		if (panel) {
			panel.reveal(vscode.ViewColumn.Beside);
			return panel;
		}

		const title = "Codex Chat (Preview)";
		const newPanel = vscode.window.createWebviewPanel(
			"kfc.codexChat",
			title,
			{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.joinPath(
						context.extensionUri,
						"dist",
						"webview",
						"codex-chat",
					),
				],
			},
		);

		const html = getHtml(context, newPanel.webview);
		newPanel.webview.html = html;

		chatManager = manager;

		// Minimal IPC: echo + runOnce
		newPanel.webview.onDidReceiveMessage((msg: InboundWebviewMessage) => {
			if (!msg || typeof msg !== "object" || !("type" in msg)) return;
			switch (msg.type) {
				case IPC.Echo: {
					const response: OutboundWebviewMessage = {
						type: IPC.EchoResult,
						id: msg.id,
						text: msg.text,
						ts: Date.now(),
					};
					newPanel.webview.postMessage(response);
					break;
				}
				case IPC.RunOnce: {
					(async () => {
						try {
							if (!chatManager) throw new Error("ChatManager unavailable");
							const out = await chatManager.runOnce(msg.text);
							const response: OutboundWebviewMessage = {
								type: IPC.Complete,
								id: msg.id,
								text: out,
								ts: Date.now(),
							};
							newPanel.webview.postMessage(response);
						} catch (e: unknown) {
							const errMsg = e instanceof Error ? e.message : String(e);
							const response: OutboundWebviewMessage = {
								type: IPC.Error,
								id: msg.id,
								error: errMsg,
								ts: Date.now(),
							};
							newPanel.webview.postMessage(response);
						}
					})();
					break;
				}
				case IPC.RunStream: {
					(async () => {
						try {
							if (!chatManager) throw new Error("ChatManager unavailable");
							// Cancel previous stream if exists
							if (currentCancel) {
								currentCancel();
								currentCancel = undefined;
								currentId = undefined;
							}
							currentId = msg.id;
							const controller = await chatManager.runStream(msg.text, {
								onChunk: (chunk) => {
									const response: OutboundWebviewMessage = {
										type: IPC.Chunk,
										id: msg.id,
										text: chunk,
										ts: Date.now(),
									};
									newPanel.webview.postMessage(response);
								},
								onError: (err) => {
									const response: OutboundWebviewMessage = {
										type: IPC.Error,
										id: msg.id,
										error: err,
										ts: Date.now(),
									};
									newPanel.webview.postMessage(response);
								},
								onComplete: (code) => {
									const response: OutboundWebviewMessage = {
										type: IPC.Complete,
										id: msg.id,
										text: "", // UI will already have chunks
										ts: Date.now(),
									};
									newPanel.webview.postMessage(response);
									currentCancel = undefined;
									currentId = undefined;
								},
							});
							currentCancel = controller.cancel;
						} catch (e) {
							const errMsg = e instanceof Error ? e.message : String(e);
							const response: OutboundWebviewMessage = {
								type: IPC.Error,
								id: msg.id,
								error: errMsg,
								ts: Date.now(),
							};
							newPanel.webview.postMessage(response);
						}
					})();
					break;
				}
				case IPC.Stop: {
					if (currentCancel && currentId === msg.id) {
						currentCancel();
						currentCancel = undefined;
						currentId = undefined;
					}
					break;
				}
				default:
					break;
			}
		});

		newPanel.onDidDispose(() => {
			panel = undefined;
		});

		panel = newPanel;
		return newPanel;
	}

	function getHtml(context: vscode.ExtensionContext, webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(
				context.extensionUri,
				"dist",
				"webview",
				"codex-chat",
				"index.js",
			),
		);

		const nonce = getNonce();

		const csp = [
			"default-src 'none'",
			`img-src ${webview.cspSource} data: blob:`,
			`style-src 'unsafe-inline' ${webview.cspSource}`,
			`font-src ${webview.cspSource}`,
			`script-src 'nonce-${nonce}'`,
		].join("; ");

		return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Codex Chat</title>
        <style>
          :root { color-scheme: light dark; }
          body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
          #root { display: grid; place-items: center; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
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
}
