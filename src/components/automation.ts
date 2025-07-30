// Stub for HistoryProvider to avoid reference errors
// Remove or replace with actual import as needed
class HistoryProvider {
    add(_item: any) {}
}
const historyProvider = new HistoryProvider();
import * as vscode from 'vscode';
import { logInteraction } from './history';

// Define log level constants
const LOG_LEVEL_INFO = 'info';
const LOG_LEVEL_ERROR = 'error';

// Accept Copilot suggestion and log interaction
export async function acceptCopilotSuggestion() {
    const PROMPT_DELAY_MS = 2000;
    await new Promise(resolve => setTimeout(resolve, PROMPT_DELAY_MS));
    try {
        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
        logInteraction(LOG_LEVEL_INFO, 'SUGGESTION_ACCEPTED', 'Accepted inline suggestion.', '');
        vscode.window.showInformationMessage('Accepted Copilot suggestion.');
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logInteraction(LOG_LEVEL_ERROR, 'SUGGESTION_ACCEPT_FAILED', errorMessage, '');
        vscode.window.showErrorMessage(`Failed to accept suggestion: ${errorMessage}`);
    }
    void historyProvider;
    // Placeholder for loop logic
    // while (true) {
    //     // Check for pause/stop conditions in shared state (import from state.ts if needed)
    //     // Generate prompt, send to chat, accept suggestion, log, etc.
    //     // For now, just break to avoid infinite loop in placeholder.
    //     break;
    // }
}

// Read and execute steps from the first instruction file in the instructions folder
export async function executeFirstInstructionFile() {
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
    const content = fs.readFileSync(filePath, 'utf-8');
    let steps;
    try {
        steps = JSON.parse(content);
    } catch (e) {
        vscode.window.showErrorMessage('Failed to parse instruction file: ' + files[0]);
        return;
    }
    vscode.window.showInformationMessage(`Loaded ${files[0]} with ${Array.isArray(steps) ? steps.length : 0} steps.`);
    // Here you would iterate and execute steps as needed
}

// Validate all JSON instruction files in the instructions directory
export async function validateInstructionFiles() {
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
        } catch {
            invalid++;
            vscode.window.showWarningMessage(`Invalid JSON in instruction file: ${file}`);
        }
    }
    vscode.window.showInformationMessage(`Validation complete: ${valid} valid, ${invalid} invalid.`);
}

// Create a template instruction file in the instructions directory
export async function createTemplateInstructionFile() {
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

// Return a comma-separated list of .ts files in the src directory
export async function listTsFilesInSrc(): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    const srcDir = path.join(__dirname, '../');
    if (!fs.existsSync(srcDir)) return '';
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts'));
    if (!files.length) return '';
    return files.join(', ');
}

// Example: Return a static string or fetch from a resource
export function getSpecUrl(): string {
    return 'https://example.com/spec';
}
