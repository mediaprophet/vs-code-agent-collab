
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
        // Use double curly braces to escape template literals in embedded JS
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat with Local Model</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans p-4">
    <h2 class="text-xl font-bold mb-2 text-blue-700">Chat with Local Model</h2>
    <div class="mb-2 text-sm text-gray-600">Model: <span class="font-semibold">${selectedModel}</span></div>
    <div id="chat" class="bg-white border border-gray-300 rounded p-2 h-80 overflow-y-auto text-sm mb-2"></div>
    <form id="chatForm" class="flex gap-2">
        <input id="prompt" type="text" class="flex-1 border rounded px-2 py-1" placeholder="Type your prompt..." autocomplete="off" />
        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded">Send</button>
        <button id="clearBtn" type="button" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded ml-2">Clear</button>
    </form>
    <div id="loading" class="hidden text-blue-600 text-xs mt-1 flex items-center"><svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Generating response...</div>
    <script>
        const vscode = acquireVsCodeApi();
        const chat = document.getElementById('chat');
        const loading = document.getElementById('loading');
        let lastModelDiv = null;
        document.getElementById('chatForm').onsubmit = function(e) {
            e.preventDefault();
            var prompt = document.getElementById('prompt').value.trim();
            if (!prompt) return;
            vscode.postMessage({ command: 'sendPrompt', prompt: prompt });
            document.getElementById('prompt').value = '';
            chat.innerHTML += '<div class="mb-1"><span class="font-semibold text-gray-700">You:</span> ' + prompt + '</div>';
            lastModelDiv = document.createElement('div');
            lastModelDiv.className = 'mb-2';
            lastModelDiv.innerHTML = '<span class="font-semibold text-green-700">Model:</span> ';
            chat.appendChild(lastModelDiv);
            chat.scrollTop = chat.scrollHeight;
        };
        document.getElementById('clearBtn').onclick = function() {
            vscode.postMessage({ command: 'clearChat' });
        };
        window.addEventListener('message', function(event) {
            if (event.data.command === 'streamMessage') {
                if (lastModelDiv) {
                    lastModelDiv.innerHTML = '<span class="font-semibold text-green-700">Model:</span> ' + event.data.response;
                    chat.scrollTop = chat.scrollHeight;
                }
            } else if (event.data.command === 'loading') {
                loading.classList.remove('hidden');
            } else if (event.data.command === 'doneLoading') {
                loading.classList.add('hidden');
            } else if (event.data.command === 'clearChat') {
                chat.innerHTML = '';
                lastModelDiv = null;
            }
        });
    <\/script>
</body>
</html>`;
    }
}
