
import * as vscode from 'vscode';
import { uiTextAreaMappings } from './uiTextAreaMappings';

/**
 * Default LLM API URL (overridden by globalState at runtime).
 */
export let LLM_API_URL = 'http://localhost:1234/v1/chat/completions';
/**
 * Default LLM model (overridden by globalState at runtime).
 */
export let LLM_MODEL = 'llama-3.2-3b-instruct';
/**
 * Default LLM temperature (overridden by globalState at runtime).
 */
export let LLM_TEMPERATURE = 0.7;
/**
 * List of available LLM endpoints.
 */
export const LLM_ENDPOINTS: { label: string; url: string }[] = [
    { label: 'Local LLM', url: 'http://localhost:1234/v1/chat/completions' },
    { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
    { label: 'Grok', url: 'https://grok.api.example.com/v1/chat/completions' }
];

/**
 * Sends a prompt to the chat input area, using mapped input if available.
 * Falls back to the default chat if mapping fails.
 * @param promptText The prompt to send
 */
export async function sendPromptToChat(promptText: string): Promise<void> {
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

/**
 * Gets the last Copilot chat response, using mapped output if available.
 * Falls back to the active editor if mapping fails.
 * @returns The last chat response or a fallback string
 */
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
