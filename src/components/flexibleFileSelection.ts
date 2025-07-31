
import * as vscode from 'vscode';

/**
 * Opens a file picker dialog for the user to select one or more files from the workspace.
 * Shows an information message with the selected file paths.
 * Handles errors gracefully and always returns an array.
 * @returns Promise of selected file paths as strings
 */
export async function flexibleFileSelection(): Promise<string[]> {
    try {
        const files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: 'Select files for automation',
            filters: { 'All files': ['*'] }
        });
        if (files && files.length > 0) {
            vscode.window.showInformationMessage(`Selected files: ${files.map(f => f.fsPath).join(', ')}`);
            return files.map(f => f.fsPath);
        } else {
            vscode.window.showInformationMessage('No files selected.');
            return [];
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage('Error selecting files: ' + errorMessage);
        return [];
    }
}
