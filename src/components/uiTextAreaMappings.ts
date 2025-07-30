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

export function resolveUITextAreaMapping(target: string): UITextAreaMapping | undefined {
    return (
        uiTextAreaMappings.find(m => m.type === target) ||
        uiTextAreaMappings.find(m => m.description?.toLowerCase() === target.toLowerCase()) ||
        uiTextAreaMappings.find(m => m.uri === target)
    );
}

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
    const mapping: UITextAreaMapping = {
        type: type.toLowerCase() as 'input' | 'output',
        uri: selected.label,
        description: description || undefined,
    };
    uiTextAreaMappings = uiTextAreaMappings.filter(m => m.uri !== mapping.uri);
    uiTextAreaMappings.push(mapping);
    await context.globalState.update('uiTextAreaMappings', uiTextAreaMappings);
    vscode.window.showInformationMessage(`Mapped ${type} area: ${mapping.uri}${description ? ` (${description})` : ''}`);
}

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
