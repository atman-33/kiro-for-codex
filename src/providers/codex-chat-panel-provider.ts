import * as vscode from "vscode";
import type {
	InboundWebviewMessage,
	OutboundWebviewMessage,
} from "../types/codex-chat-types";
import { IPC } from "../types/ipc/codex-chat-events";

export namespace CodexChatPanelProvider {
	let panel: vscode.WebviewPanel | undefined;

	export function open(context: vscode.ExtensionContext) {
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

		// Minimal IPC: echo back a message
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
