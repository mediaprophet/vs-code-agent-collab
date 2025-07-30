// Helper to resolve a UI text area mapping by type, description, or URI
export function resolveUITextAreaMapping(target: string): UITextAreaMapping | undefined {
    // target can be 'input', 'output', a description, or a URI
    return (
        uiTextAreaMappings.find(m => m.type === target) ||
        uiTextAreaMappings.find(m => m.description?.toLowerCase() === target.toLowerCase()) ||
        uiTextAreaMappings.find(m => m.uri === target)
    );
}
// Suggest likely chat input/output areas based on URI patterns
export async function suggestChatMappings(context: vscode.ExtensionContext) {
    const openDocs = vscode.workspace.textDocuments;
    const chatDocs = openDocs.filter(doc => doc.uri.scheme === 'vscode-chat');
    if (chatDocs.length === 0) {
        vscode.window.showInformationMessage('No likely Copilot Chat areas detected.');
        return;
    }
    const picks = chatDocs.map(doc => ({
        label: doc.uri.toString(),
        description: doc.isDirty ? 'Unsaved changes' : undefined
    }));
    const selected = await vscode.window.showQuickPick(picks, { placeHolder: 'Select a chat area to map as input or output' });
    if (!selected) return;
    const type = await vscode.window.showQuickPick(['Input', 'Output'], { placeHolder: 'Classify this area as input or output' });
    if (!type) return;
    const description = await vscode.window.showInputBox({ prompt: 'Enter an optional description for this text area', placeHolder: 'Optional description' });
    const mapping = {
        type: type.toLowerCase() as 'input' | 'output',
        uri: selected.label,
        description: description || undefined,
    };
    uiTextAreaMappings = uiTextAreaMappings.filter(m => m.uri !== mapping.uri);
    uiTextAreaMappings.push(mapping);
    await context.globalState.update('uiTextAreaMappings', uiTextAreaMappings);
    vscode.window.showInformationMessage(`Mapped ${type} area: ${mapping.uri}${description ? ` (${description})` : ''}`);
}
// Export UI text area mappings to a JSON file
export async function exportUITextAreaMappings() {
    if (uiTextAreaMappings.length === 0) {
        vscode.window.showInformationMessage('No UI text area mappings to export.');
        return;
    }
    const uri = await vscode.window.showSaveDialog({
        filters: { 'JSON': ['json'] },
        saveLabel: 'Export UI Mappings as JSON'
    });
    if (!uri) return;
    const json = JSON.stringify(uiTextAreaMappings, null, 2);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
    vscode.window.showInformationMessage('UI text area mappings exported.');
}

// Import UI text area mappings from a JSON file
export async function importUITextAreaMappings(context: vscode.ExtensionContext) {
    const [uri] = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { 'JSON': ['json'] },
        openLabel: 'Import UI Mappings from JSON'
    }) || [];
    if (!uri) return;
    const bytes = await vscode.workspace.fs.readFile(uri);
    try {
        const imported = JSON.parse(Buffer.from(bytes).toString('utf8'));
        if (Array.isArray(imported)) {
            uiTextAreaMappings.length = 0;
            uiTextAreaMappings.push(...imported);
            await context.globalState.update('uiTextAreaMappings', uiTextAreaMappings);
            vscode.window.showInformationMessage('UI text area mappings imported.');
        } else {
            vscode.window.showErrorMessage('Invalid mappings file.');
        }
    } catch (err) {
        vscode.window.showErrorMessage('Failed to import mappings: ' + err);
    }
}
// Command to view, edit, or remove UI text area mappings
export async function manageUITextAreaMappings(context: vscode.ExtensionContext) {
    if (uiTextAreaMappings.length === 0) {
        vscode.window.showInformationMessage('No UI text area mappings found.');
        return;
    }
    const pick = await vscode.window.showQuickPick(
        uiTextAreaMappings.map((m, i) => ({
            label: `${m.type.toUpperCase()}: ${m.description || m.uri}`,
            description: m.uri,
            index: i
        })),
        { placeHolder: 'Select a mapping to edit or remove' }
    );
    if (!pick) return;
    const action = await vscode.window.showQuickPick(['Edit', 'Remove', 'Cancel'], { placeHolder: 'Edit or remove this mapping?' });
    if (action === 'Edit') {
        const newType = await vscode.window.showQuickPick(['Input', 'Output'], { placeHolder: 'Update type', ignoreFocusOut: true });
        if (!newType) return;
        const newDesc = await vscode.window.showInputBox({ prompt: 'Update description', value: uiTextAreaMappings[pick.index].description || '', ignoreFocusOut: true });
        uiTextAreaMappings[pick.index].type = newType.toLowerCase() as 'input' | 'output';
        uiTextAreaMappings[pick.index].description = newDesc || undefined;
        await context.globalState.update('uiTextAreaMappings', uiTextAreaMappings);
        vscode.window.showInformationMessage('Mapping updated.');
    } else if (action === 'Remove') {
        uiTextAreaMappings.splice(pick.index, 1);
        await context.globalState.update('uiTextAreaMappings', uiTextAreaMappings);
        vscode.window.showInformationMessage('Mapping removed.');
    }
}

// Returns the last Copilot Chat response from the mapped output area, or falls back to editor context
export async function getLastCopilotChatResponse(): Promise<string> {
    const outputMapping = uiTextAreaMappings.find(m => m.type === 'output');
    if (outputMapping && outputMapping.uri.startsWith('vscode-chat')) {
        try {
            const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(outputMapping.uri));
            const text = document.getText();
            if (text.match(/continue|proceed|confirm/i)) {
                return 'continue';
            }
            if (!text) {
                vscode.window.showWarningMessage('Mapped output area is empty. Falling back to editor.');
            } else {
                return text;
            }
        } catch (err) {
            vscode.window.showWarningMessage('Unable to read mapped output area. Falling back to editor.');
        }
    }
    // Fallback to editor context
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        const selectedText = document.getText(selection);
        if (!selectedText && !document.getText()) {
            vscode.window.showWarningMessage('No content in active editor.');
        }
        return selectedText || document.getText() || 'No content in active editor.';
    }
    vscode.window.showWarningMessage('No active editor context available.');
    return 'No active editor context available.';
}

// Sends a prompt to the mapped input area, or falls back to default chat command
export async function sendPromptToChat(promptText: string) {
    if (!promptText) {
        vscode.window.showErrorMessage('Cannot send empty prompt to Copilot.');
        return;
    }
    const inputMapping = uiTextAreaMappings.find(m => m.type === 'input');
    if (inputMapping && inputMapping.uri.startsWith('vscode-chat')) {
        try {
            await vscode.commands.executeCommand('workbench.action.chat.submit', { text: promptText });
            vscode.window.showInformationMessage('Prompt sent to mapped input area.');
            return;
        } catch (err) {
            vscode.window.showWarningMessage('Unable to send to mapped input area. Falling back to default chat.');
        }
    }
    // Fallback to default command
    await vscode.commands.executeCommand('workbench.action.chat.open', promptText);
    vscode.window.showInformationMessage('Prompt sent to Copilot (default chat).');
}
import * as vscode from 'vscode';

export interface UITextAreaMapping {
    type: 'input' | 'output';
    uri: string; // URI of the document or webview (e.g., vscode-chat://...)
    description?: string; // Optional user-provided label
}


export let uiTextAreaMappings: UITextAreaMapping[] = [];

export function loadUITextAreaMappings(context: vscode.ExtensionContext) {
    const mappings = context.globalState.get<UITextAreaMapping[]>('uiTextAreaMappings', []);
    uiTextAreaMappings = mappings;
}

export async function mapUITextArea(context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found. Please highlight text in the Copilot Chat panel or an editor.');
        return;
    }

    const document = editor.document;
    const uri = document.uri.toString();

    // Prompt user to classify the area
    const type = await vscode.window.showQuickPick(['Input', 'Output'], {
        placeHolder: `Classify the highlighted area in ${uri} as input or output`,
    });

    if (!type) {
        vscode.window.showWarningMessage('No type selected. Mapping cancelled.');
        return;
    }

    const description = await vscode.window.showInputBox({
        prompt: 'Enter an optional description for this text area (e.g., "Copilot Chat Input")',
        placeHolder: 'Optional description',
    });

    const mapping: UITextAreaMapping = {
        type: type.toLowerCase() as 'input' | 'output',
        uri,
        description: description || undefined,
    };

    // Update mappings
    uiTextAreaMappings = uiTextAreaMappings.filter(m => m.uri !== uri); // Remove duplicates
    uiTextAreaMappings.push(mapping);
    await context.globalState.update('uiTextAreaMappings', uiTextAreaMappings);

    vscode.window.showInformationMessage(`Mapped ${type} area: ${uri}${description ? ` (${description})` : ''}`);
}
