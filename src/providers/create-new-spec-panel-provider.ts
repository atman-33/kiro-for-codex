import * as vscode from "vscode";
import type { SpecManager } from "../features/spec/spec-manager";

type SpecCreationMode = "standard" | "agents";

export class CreateNewSpecPanelProvider {
	private panel: vscode.WebviewPanel | null = null;
	private currentMode: SpecCreationMode = "standard";

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly specManager: SpecManager,
	) {}

	public show(mode: SpecCreationMode = "standard") {
		this.currentMode = mode;
		if (this.panel) {
			this.panel.title = this.getPanelTitle(mode);
			this.panel.webview.postMessage({ type: "spec.create/setMode", mode });
			this.panel.reveal(vscode.ViewColumn.Active);
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			"kiroCodex.createNewSpec",
			this.getPanelTitle(mode),
			{ viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.joinPath(
						this.context.extensionUri,
						"dist",
						"webview",
						"app",
					),
				],
				retainContextWhenHidden: true,
			},
		);

		this.panel.onDidDispose(() => (this.panel = null));
		this.panel.webview.html = this.getHtml(this.panel.webview, mode);

		this.panel.webview.onDidReceiveMessage(async (msg: any) => {
			try {
				if (!msg || typeof msg !== "object") return;
				if (msg.type === "spec.create/submit") {
					const text = String(msg.text ?? "");
					const id = msg.id ?? "submit";
					if (this.currentMode === "agents") {
						await this.specManager.createWithAgentsFromDescription(text);
					} else {
						await this.specManager.createFromDescription(text);
					}
					this.panel?.webview.postMessage({
						type: "spec.create/ack",
						id,
						ts: Date.now(),
					});
				}
			} catch (e) {
				this.panel?.webview.postMessage({
					type: "spec.create/error",
					id: (msg as any)?.id ?? "unknown",
					error: e instanceof Error ? e.message : String(e),
					ts: Date.now(),
				});
			}
		});
	}

	private getPanelTitle(mode: SpecCreationMode): string {
		return mode === "agents" ? "New Spec with Agents" : "Create New Spec";
	}

	private getHtml(webview: vscode.Webview, mode: SpecCreationMode) {
		const base = vscode.Uri.joinPath(
			this.context.extensionUri,
			"dist",
			"webview",
			"app",
		);

		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(base, "index.js"),
		);
		const cssUri = webview.asWebviewUri(
			vscode.Uri.joinPath(base, "assets", "index.css"),
		);

		const nonce = this.getNonce();
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
    <title>Create New Spec</title>
    <link rel="stylesheet" href="${cssUri}">
    <style>
      :root { color-scheme: light dark; }
      html, body, #root { height: 100%; width: 100%; margin: 0; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    </style>
  </head>
  <body>
    <div id="root" data-page="create-new-spec" data-mode="${mode}"></div>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
	}

	private getNonce() {
		let text = "";
		const possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
