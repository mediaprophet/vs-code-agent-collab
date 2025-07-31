
import * as vscode from 'vscode';



import { LMStudioClient } from '@lmstudio/sdk';

// Streaming implementation: send prompt to LM Studio local model and stream response fragments
async function streamPromptFromLocalLLM(prompt: string, onFragment: (fragment: string) => void): Promise<string> {
    try {
        let model = 'llama-3.2-3b-instruct';
        let temperature = 0.7;
        if (vscode.extensions.getExtension('mediaprophet.copilot-automator-grok-gpt')?.exports?.context) {
            const ctx = vscode.extensions.getExtension('mediaprophet.copilot-automator-grok-gpt')?.exports?.context;
            model = ctx.globalState.get('llmModel', model) || model;
            temperature = ctx.globalState.get('llmTemp', temperature) || temperature;
        }
        if (!model || model === 'select model') {
            onFragment('Please load or select a model in LM Studio and the Automator extension.');
            return 'No model selected.';
        }
        const client = new LMStudioClient();
        let response = '';
        try {
            const handle = client.llm.createDynamicHandle(model);
            const prediction = handle.respond([
                { role: 'user', content: prompt }
            ], { temperature });
            for await (const fragment of prediction) {
                if (fragment && fragment.content) {
                    response += fragment.content;
                    onFragment(response);
                }
            }
            return response || '[No response from model]';
        } catch (err: any) {
            onFragment('Please load or select a model in LM Studio and the Automator extension.');
            return 'No model loaded.';
        }
    } catch (err: any) {
        onFragment('Error: ' + (err?.message || String(err)));
        return 'Error: ' + (err?.message || String(err));
    }
}

export class LocalChatPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'copilotAutomatorLocalChat';

    private webviewView?: vscode.WebviewView;
    constructor(private context?: vscode.ExtensionContext) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext<unknown>,
        _token: vscode.CancellationToken
    ): void {
        this.webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        this.refreshHtml();
        webviewView.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'sendPrompt') {
                const prompt = msg.prompt;
                let lastSent = '';
                // Show loading indicator
                webviewView.webview.postMessage({ command: 'loading', prompt });
                await streamPromptFromLocalLLM(prompt, (fragment) => {
                    // Only send new content
                    if (fragment !== lastSent) {
                        webviewView.webview.postMessage({ command: 'streamMessage', prompt, response: fragment });
                        lastSent = fragment;
                    }
                });
                // Remove loading indicator
                webviewView.webview.postMessage({ command: 'doneLoading', prompt });
            } else if (msg.command === 'clearChat') {
                webviewView.webview.postMessage({ command: 'clearChat' });
            }
        });
    }

    public refreshHtml() {
        if (!this.webviewView) return;
        let selectedModel = 'select model';
        try {
            if (this.context) {
                selectedModel = this.context.globalState.get('llmModel', 'select model') || 'select model';
            }
        } catch {}
        if (!selectedModel) {
            selectedModel = 'select model';
        }
        this.webviewView.webview.html = this.getHtml(selectedModel);
    }

    private getHtml(selectedModel: string): string {
        const fs = require('fs');
        const path = require('path');
        // Path to the HTML file in the extension
        const htmlPath = path.join(__dirname, '..', 'ui', 'localChatPanel.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Insert the selected model name
        html = html.replace('id="selectedModel">select model<', `id="selectedModel">${selectedModel}<`);

        // Resolve the script path for the webview
        let scriptUriString = 'localChatPanel.js';
        if (this.context && (this.context as any).extensionUri) {
            const extUri = (this.context as any).extensionUri;
            const scriptPathOnDisk = vscode.Uri.joinPath(extUri, 'out', 'ui', 'localChatPanel.js');
            scriptUriString = scriptPathOnDisk.toString();
        }
        // Replace script src with webview URI
        html = html.replace('src="localChatPanel.js"', `src="${scriptUriString}"`);
        return html;
    }
}
