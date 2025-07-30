import * as vscode from 'vscode';

/**
 * Opens a file picker dialog for the user to select one or more files from the workspace.
 * Shows an information message with the selected file paths.
 */
export async function flexibleFileSelection(): Promise<string[]> {
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
}
