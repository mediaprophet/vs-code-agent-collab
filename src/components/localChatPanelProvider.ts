import * as vscode from 'vscode';
import { generatePromptFromLocalLLM } from './commands';

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
                let response = '';
                try {
                    response = await generatePromptFromLocalLLM(prompt, '', '', false);
                } catch (err: any) {
                    response = 'Error: ' + (err?.message || String(err));
                }
                webviewView.webview.postMessage({ command: 'addMessage', prompt, response });
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
    </form>
    <script>
        const vscode = acquireVsCodeApi();
        const chat = document.getElementById('chat');
        document.getElementById('chatForm').onsubmit = function(e) {
            e.preventDefault();
            var prompt = document.getElementById('prompt').value.trim();
            if (!prompt) return;
            vscode.postMessage({ command: 'sendPrompt', prompt: prompt });
            document.getElementById('prompt').value = '';
            chat.innerHTML += '<div class="mb-1"><span class="font-semibold text-gray-700">You:</span> ' + prompt + '</div>';
        };
        window.addEventListener('message', function(event) {
            if (event.data.command === 'addMessage') {
                chat.innerHTML += '<div class="mb-2"><span class="font-semibold text-green-700">Model:</span> ' + event.data.response + '</div>';
                chat.scrollTop = chat.scrollHeight;
            }
        });
    <\/script>
</body>
</html>`;
    }
}
