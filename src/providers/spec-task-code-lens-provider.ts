import * as vscode from 'vscode';

export class SpecTaskCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        // Pattern is already filtered by registration, but double-check for tasks.md
        if (!document.fileName.includes('.codex/specs/') && !document.fileName.endsWith('tasks.md')) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        // Use regex split to handle both Windows (CRLF) and Unix (LF) line endings
        const lines = text.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match task list format: - [ ] task description
            const taskMatch = line.match(/^(\s*)- \[ \] (.+)$/);

            if (taskMatch) {
                const range = new vscode.Range(i, 0, i, line.length);
                const taskDescription = taskMatch[2];

                // Create CodeLens
                const codeLens = new vscode.CodeLens(range, {
                    title: "$(play) Start Task",
                    tooltip: "Click to execute this task",
                    command: "kiroCodex.spec.implTask",
                    arguments: [document.uri, i, taskDescription]
                });

                codeLenses.push(codeLens);
            }
        }

        return codeLenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        return codeLens;
    }
}
