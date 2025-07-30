import * as vscode from 'vscode';

export class AutomatorPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'copilotAutomatorPanel';

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        webviewView.webview.options = { enableScripts: true, localResourceRoots: [this._extensionUri] };
        webviewView.webview.html = this.getHtmlForWebview();
    }

    private getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copilot Automator</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans p-4">
    <header class="flex items-center mb-4">
        <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f916.svg" alt="Robot Icon" class="w-8 h-8 mr-2" />
        <h2 class="text-2xl font-bold text-blue-700">Copilot Automator</h2>
    </header>
    <section aria-label="Automation Controls" class="mb-4">
        <h3 class="text-lg font-semibold mb-2 flex items-center"><span class="mr-2">⚡</span>Quick Actions</h3>
        <div id="controls" class="flex flex-wrap gap-2">
            <button id="mapUITextAreaBtn" title="Map UI text area" aria-label="Map UI Text Area" class="transition bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center"><span class="mr-1">🖌️</span>Map UI Area</button>
            <button id="manageMappingsBtn" title="Manage UI mappings" aria-label="Manage UI Mappings" class="transition bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-cyan-400 flex items-center"><span class="mr-1">🗂️</span>Manage UI Mappings</button>
            <button id="exportMappingsBtn" title="Export UI mappings" aria-label="Export UI Mappings" class="transition bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 flex items-center"><span class="mr-1">⬇️</span>Export Mappings</button>
            <button id="importMappingsBtn" title="Import UI mappings" aria-label="Import UI Mappings" class="transition bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center"><span class="mr-1">⬆️</span>Import Mappings</button>
            <button id="suggestMappingsBtn" title="Suggest Chat Mappings" aria-label="Suggest Chat Mappings" class="transition bg-fuchsia-700 hover:bg-fuchsia-800 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-fuchsia-400 flex items-center"><span class="mr-1">🤖</span>Suggest Chat Mappings</button>
            <button id="goBtn" title="Start agent cooperation" aria-label="Go" class="transition bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center"><span class="mr-1">▶️</span>Go</button>
            <button id="pauseBtn" title="Pause agent cooperation" aria-label="Pause" class="transition bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center"><span class="mr-1">⏸️</span>Pause</button>
            <button id="resumeBtn" title="Resume agent cooperation" aria-label="Resume" class="transition bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center"><span class="mr-1">▶️</span>Resume</button>
            <button id="stopBtn" title="Stop agent cooperation" aria-label="Stop" class="transition bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center"><span class="mr-1">⏹️</span>Stop</button>
            <button id="settingsBtn" title="Open settings panel" aria-label="Settings" class="transition bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center"><span class="mr-1">⚙️</span>Settings</button>
            <button id="selectFilesBtn" title="Select files for LLM review" aria-label="Select Files" class="transition bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 flex items-center"><span class="mr-1">📂</span>Select Files</button>
            <button id="specResourcesBtn" title="Manage specification resource URLs" aria-label="Spec Resources" class="transition bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center"><span class="mr-1">📜</span>Spec Resources</button>
            <button id="runInstructionBtn" title="Run instruction file" aria-label="Run Instruction" class="transition bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center"><span class="mr-1">🚀</span>Run Instruction</button>
            <button id="logViewerBtn" title="View logs" aria-label="View Logs" class="transition bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center"><span class="mr-1">📜</span>View Logs</button>
        </div>
    </section>
    <section aria-label="Dialogue Log" class="mb-4">
        <h3 class="text-lg font-semibold mb-2 flex items-center"><span class="mr-2">💬</span>Dialogue</h3>
        <div id="dialogue" class="border border-gray-300 bg-white p-2 h-40 overflow-y-auto rounded mb-4 shadow-inner" aria-live="polite"></div>
    </section>
    <section aria-label="Send Command">
        <h3 class="text-lg font-semibold mb-2 flex items-center"><span class="mr-2">⌨️</span>Send Command</h3>
        <form id="commandForm" class="flex gap-2">
            <input type="text" id="commandInput" placeholder="Type a command (e.g., sendPrompt)" aria-label="Command Input" class="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <button type="submit" title="Send command to LLM or agent" aria-label="Send" class="transition bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center"><span class="mr-1">📤</span>Send</button>
        </form>
    </section>
    <script>
        const vscode = acquireVsCodeApi();
        const dialogue = document.getElementById('dialogue');
        document.getElementById('mapUITextAreaBtn').onclick = () => {
            vscode.postMessage({ command: 'mapUITextArea' });
            addDialogue('User: Map UI Text Area');
        };
        document.getElementById('manageMappingsBtn').onclick = () => {
            vscode.postMessage({ command: 'manageUITextAreaMappings' });
            addDialogue('User: Manage UI Mappings');
        };
        document.getElementById('exportMappingsBtn').onclick = () => {
            vscode.postMessage({ command: 'exportUITextAreaMappings' });
            addDialogue('User: Export UI Mappings');
        };
        document.getElementById('importMappingsBtn').onclick = () => {
            vscode.postMessage({ command: 'importUITextAreaMappings' });
            addDialogue('User: Import UI Mappings');
        };
        document.getElementById('suggestMappingsBtn').onclick = () => {
            vscode.postMessage({ command: 'suggestChatMappings' });
            addDialogue('User: Suggest Chat Mappings');
        };
        document.getElementById('goBtn').onclick = () => {
            vscode.postMessage({ command: 'start' });
            addDialogue('User: Go');
        };
        document.getElementById('pauseBtn').onclick = () => {
            vscode.postMessage({ command: 'pause' });
            addDialogue('User: Pause');
        };
        document.getElementById('resumeBtn').onclick = () => {
            vscode.postMessage({ command: 'resume' });
            addDialogue('User: Resume');
        };
        document.getElementById('stopBtn').onclick = () => {
            vscode.postMessage({ command: 'stop' });
            addDialogue('User: Stop');
        };
        document.getElementById('settingsBtn').onclick = () => {
            vscode.postMessage({ command: 'openSettings' });
            addDialogue('User: Open Settings');
        };
        document.getElementById('selectFilesBtn').onclick = () => {
            vscode.postMessage({ command: 'selectFiles' });
            addDialogue('User: Select Files for Review');
        };
        document.getElementById('specResourcesBtn').onclick = () => {
            vscode.postMessage({ command: 'manageSpecResources' });
            addDialogue('User: Manage Specification Resources');
        };
        document.getElementById('runInstructionBtn').onclick = () => {
            vscode.postMessage({ command: 'runInstructionFile' });
            addDialogue('User: Run Instruction File');
        };
        document.getElementById('logViewerBtn').onclick = () => {
            vscode.postMessage({ command: 'openLogViewer' });
            addDialogue('User: View Logs');
        };
        document.getElementById('commandForm').onsubmit = (e) => {
            e.preventDefault();
            const cmd = document.getElementById('commandInput').value;
            if (cmd) {
                vscode.postMessage({ command: 'sendCommand', value: cmd });
                addDialogue('User: ' + cmd);
                document.getElementById('commandInput').value = '';
            }
        };
        window.addEventListener('message', event => {
            if (event.data && event.data.type === 'dialogue') {
                addDialogue(event.data.text);
            }
        });
        function addDialogue(text) {
            const div = document.createElement('div');
            div.textContent = text;
            div.className = 'transition-opacity duration-300 opacity-0';
            dialogue.appendChild(div);
            setTimeout(() => { div.className = 'transition-opacity duration-300 opacity-100'; }, 10);
            dialogue.scrollTop = dialogue.scrollHeight;
        }
    </script>
</body>
</html>`;
    }
}