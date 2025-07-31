
import * as vscode from 'vscode';
import { logInteraction } from './history';

/**
 * Log level constants for interaction logging.
 */
const LOG_LEVEL_INFO = 'info';
const LOG_LEVEL_ERROR = 'error';

/**
 * Accepts a Copilot suggestion and logs the interaction.
 * Handles errors robustly and notifies the user.
 */
export async function acceptCopilotSuggestion(): Promise<void> {
    const PROMPT_DELAY_MS = 2000;
    await new Promise(resolve => setTimeout(resolve, PROMPT_DELAY_MS));
    try {
        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
        logInteraction(LOG_LEVEL_INFO, 'SUGGESTION_ACCEPTED', 'Accepted inline suggestion.', '');
        vscode.window.showInformationMessage('Accepted Copilot suggestion.');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logInteraction(LOG_LEVEL_ERROR, 'SUGGESTION_ACCEPT_FAILED', errorMessage, '');
        vscode.window.showErrorMessage(`Failed to accept suggestion: ${errorMessage}`);
    }
}


/**
 * Reads and executes steps from the first instruction file in the instructions folder.
 * Handles missing files and JSON parse errors gracefully.
 */
export async function executeFirstInstructionFile(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const instructionsDir = path.join(__dirname, '../../instructions');
    if (!fs.existsSync(instructionsDir)) {
        vscode.window.showWarningMessage('No instructions directory found.');
        return;
    }
    const files = fs.readdirSync(instructionsDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        vscode.window.showWarningMessage('No instruction files found.');
        return;
    }
    const filePath = path.join(instructionsDir, files[0]);
    let content = '';
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        vscode.window.showErrorMessage('Failed to read instruction file: ' + files[0]);
        return;
    }
    let steps: unknown;
    try {
        steps = JSON.parse(content);
    } catch (e) {
        vscode.window.showErrorMessage('Failed to parse instruction file: ' + files[0]);
        return;
    }
    vscode.window.showInformationMessage(`Loaded ${files[0]} with ${Array.isArray(steps) ? steps.length : 0} steps.`);
    // Here you would iterate and execute steps as needed
}


/**
 * Validates all JSON instruction files in the instructions directory.
 * Notifies the user of any invalid files and summarizes the results.
 */
export async function validateInstructionFiles(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const instructionsDir = path.join(__dirname, '../../instructions');
    if (!fs.existsSync(instructionsDir)) {
        vscode.window.showWarningMessage('No instructions directory found.');
        return;
    }
    const files = fs.readdirSync(instructionsDir).filter(f => f.endsWith('.json'));
    let valid = 0, invalid = 0;
    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(instructionsDir, file), 'utf-8');
            JSON.parse(content);
            valid++;
        } catch (err) {
            invalid++;
            vscode.window.showWarningMessage(`Invalid JSON in instruction file: ${file}`);
        }
    }
    vscode.window.showInformationMessage(`Validation complete: ${valid} valid, ${invalid} invalid.`);
}


/**
 * Creates a template instruction file in the instructions directory.
 * Lets the user pick files for automation and notifies them of the selection.
 */
export async function createTemplateInstructionFile(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const instructionsDir = path.join(__dirname, '../../instructions');
    if (!fs.existsSync(instructionsDir)) {
        fs.mkdirSync(instructionsDir, { recursive: true });
    }
    // Template for instruction file (add usage if needed)
    // const template = [
    //     { action: 'openFile', prompt: 'Open README.md' },
    //     { action: 'edit', prompt: 'Add project description.' }
    // ];
    // Optionally write template to file here
    // Let user pick files from workspace
    const files = await vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: 'Select files for automation',
        filters: { 'All files': ['*'] }
    });
    if (files && files.length > 0) {
        vscode.window.showInformationMessage(`Selected files: ${files.map(f => f.fsPath).join(', ')}`);
    } else {
        vscode.window.showInformationMessage('No files selected.');
    }
}


/**
 * Returns a comma-separated list of .ts files in the src directory.
 * @returns Comma-separated string of TypeScript filenames.
 */
export async function listTsFilesInSrc(): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    const srcDir = path.join(__dirname, '../');
    if (!fs.existsSync(srcDir)) return '';
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts'));
    if (!files.length) return '';
    return files.join(', ');
}


/**
 * Returns the specification URL (static or fetched from a resource).
 */
export function getSpecUrl(): string {
    return 'https://example.com/spec';
}
