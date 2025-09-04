import * as vscode from 'vscode';

/**
 * Utility class for displaying notifications
 */
export class NotificationUtils {
    /**
     * Show a notification that automatically dismisses after a specified duration
     * @param message - The message to display
     * @param durationMs - Duration in milliseconds (default: 3000ms)
     */
    static async showAutoDismissNotification(message: string, durationMs: number = 3000): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: message,
            cancellable: false
        }, async () => {
            await new Promise(resolve => setTimeout(resolve, durationMs));
        });
    }

    /**
     * Show an error notification
     * @param message - The error message to display
     */
    static showError(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    /**
     * Show a warning notification
     * @param message - The warning message to display
     */
    static showWarning(message: string): void {
        vscode.window.showWarningMessage(message);
    }

    /**
     * Show an information notification (standard, doesn't auto-dismiss)
     * @param message - The information message to display
     */
    static showInfo(message: string): void {
        vscode.window.showInformationMessage(message);
    }
}