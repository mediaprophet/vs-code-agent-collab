import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';


// --- Run Automation Job from Instruction File ---
interface InstructionStep {
    action: string;
    prompt?: string;
    [key: string]: any;
}

async function runAutomationFromInstructionFile(context: vscode.ExtensionContext, historyProvider: HistoryProvider) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (!instructionsDir) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }
    const files = fs.readdirSync(instructionsDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        vscode.window.showWarningMessage('No instruction files found.');
        return;
    }
    const fileName = await vscode.window.showQuickPick(files, { placeHolder: 'Select an instruction file to run' });
    if (!fileName) return;
    const filePath = path.join(instructionsDir, fileName);
    let steps: InstructionStep[] = [];
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        steps = parsed.steps;
        if (!Array.isArray(steps)) throw new Error('No steps array in file.');
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to parse instruction file: ${msg}`);
        return;
    }
    for (const [i, step] of steps.entries()) {
        try {
            switch (step.action) {
                case 'sendPrompt':
                    if (!step.prompt) throw new Error('Missing prompt in step.');
                    await sendPromptToChat(step.prompt, historyProvider);
                    break;
                case 'acceptSuggestion':
                    await acceptCopilotSuggestion();
                    break;
                default:
                    historyProvider.add(new HistoryItem('Unknown Step', `Step ${i + 1}: ${JSON.stringify(step)}`));
                    logInteraction(LOG_LEVEL_WARNING, 'UNKNOWN_STEP', step);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            historyProvider.add(new HistoryItem('Step Failed', `Step ${i + 1}: ${msg}`));
            logInteraction(LOG_LEVEL_ERROR, 'STEP_FAILED', { step, error: msg });
            vscode.window.showErrorMessage(`Step ${i + 1} failed: ${msg}`);
            break;
        }
    }
    vscode.window.showInformationMessage('Automation job complete.');
}

// --- Validate All Instruction JSON Files ---
async function validateAllInstructionFiles(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (!instructionsDir) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }
    const files = fs.readdirSync(instructionsDir).filter(f => f.endsWith('.json'));
    let errors: string[] = [];
    let warnings: string[] = [];
    for (const file of files) {
        const filePath = path.join(instructionsDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            if (!parsed.description || !Array.isArray(parsed.steps)) {
                warnings.push(`${file}: Missing 'description' or 'steps' array.`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${file}: Invalid JSON (${msg})`);
        }
    }
    let summary = '';
    if (errors.length === 0 && warnings.length === 0) {
        summary = 'All instruction files are valid.';
    } else {
        if (errors.length > 0) summary += 'Errors:\n' + errors.join('\n') + '\n';
        if (warnings.length > 0) summary += 'Warnings:\n' + warnings.join('\n');
    }
    if (errors.length > 0) {
        vscode.window.showErrorMessage(summary, { modal: true });
    } else {
        vscode.window.showInformationMessage(summary, { modal: true });
    }
}

// --- Create Template Instruction JSON ---
async function createTemplateInstructionFile(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (!instructionsDir) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }
    const defaultName = `instruction-${Date.now()}.json`;
    const fileName = await vscode.window.showInputBox({
        prompt: 'Enter a name for the new instruction file',
        value: defaultName
    });
    if (!fileName) return;
    const filePath = path.join(instructionsDir, fileName.endsWith('.json') ? fileName : fileName + '.json');
    if (fs.existsSync(filePath)) {
        vscode.window.showWarningMessage('File already exists.');
        return;
    }
    const template = {
        "description": "Describe the automation goal or instruction.",
        "steps": [
            { "action": "sendPrompt", "prompt": "Your prompt here." },
            { "action": "acceptSuggestion" }
        ]
    };
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
    logInteraction('INFO', 'TEMPLATE_CREATED', filePath);
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(`Template instruction file created: ${filePath}`);
}

// --- Log Viewer Panel ---
function openLogViewerPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorLogViewer',
        'Copilot Automator Logs',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    let logContent = '';
    try {
        logContent = fs.readFileSync(logFilePath, 'utf-8');
    } catch (err) {
        logContent = 'No log file found or failed to read log.';
    }
    panel.webview.html = getLogViewerHtml(logContent);
    panel.webview.onDidReceiveMessage((msg: any) => {
        if (msg.command === 'filterLogs') {
            let filtered = '';
            try {
                const lines = logContent.split('\n').filter(Boolean);
                filtered = lines.filter(line => {
                    try {
                        const entry = JSON.parse(line);
                        return msg.level === 'ALL' || entry.logLevel === msg.level;
                    } catch { return false; }
                }).join('\n');
            } catch { filtered = 'Error filtering logs.'; }
            panel.webview.postMessage({ command: 'showFiltered', content: filtered });
        }
    });
}

function getLogViewerHtml(logContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copilot Automator Logs</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans p-4">
    <h2 class="text-2xl font-bold mb-4 text-blue-700">Copilot Automator Logs</h2>
    <div class="mb-4">
        <label class="mr-2 font-semibold">Filter by Level:</label>
        <select id="logLevel" class="border rounded px-2 py-1">
            <option value="ALL">All</option>
            <option value="INFO">INFO</option>
            <option value="ERROR">ERROR</option>
            <option value="WARNING">WARNING</option>
        </select>
        <button id="filterBtn" class="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded">Filter</button>
    </div>
    <pre id="logContent" class="bg-white border border-gray-300 rounded p-2 h-96 overflow-y-auto text-xs">${logContent.replace(/</g, '&lt;')}</pre>
    <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('filterBtn').onclick = () => {
            const level = document.getElementById('logLevel').value;
            vscode.postMessage({ command: 'filterLogs', level });
        };
        window.addEventListener('message', event => {
            if (event.data.command === 'showFiltered') {
                document.getElementById('logContent').textContent = event.data.content;
            }
        });
    </script>
</body>
</html>`;
}

// --- Automation History / Logs Tree View ---
class HistoryItem {
    constructor(
        public readonly label: string,
        public readonly description?: string,
        public readonly command?: vscode.Command
    ) {}
}

class HistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem | null | undefined> = new vscode.EventEmitter<HistoryItem | null | undefined>();
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | null | undefined> = this._onDidChangeTreeData.event;
    private history: HistoryItem[] = [];
    private static readonly CONTROL_ITEMS = [
        new HistoryItem('▶️ Start Automation', '', {
            command: 'copilot-automator.start',
            title: 'Start Automation'
        }),
        new HistoryItem('⏹️ Stop Automation', '', {
            command: 'copilot-automator.stop',
            title: 'Stop Automation'
        }),
        new HistoryItem('⚙️ Settings', '', {
            command: 'copilot-automator.openSettings',
            title: 'Open Settings'
        }),
        new HistoryItem('📜 Spec Resources', '', {
            command: 'copilot-automator.manageSpecResources',
            title: 'Manage Specification Resources'
        })
    ];

    add(item: HistoryItem) {
        this.history.unshift(item);
        if (this.history.length > 50) this.history.pop();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: HistoryItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        item.description = element.description;
        item.command = element.command;
        return item;
    }

    getChildren(): Promise<HistoryItem[]> {
        return Promise.resolve([
            ...HistoryProvider.CONTROL_ITEMS,
            ...this.history
        ]);
    }
}

// --- Available Commands Tree View ---
class CommandsProvider implements vscode.TreeDataProvider<CommandItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandItem | null | undefined> = new vscode.EventEmitter<CommandItem | null | undefined>();
    readonly onDidChangeTreeData: vscode.Event<CommandItem | null | undefined> = this._onDidChangeTreeData.event;
    private commands: CommandItem[] = [];

    constructor(commandsJson: any) {
        this.commands = (commandsJson.commands || []).map((cmd: any) => new CommandItem(cmd.command, cmd.description));
    }

    getTreeItem(element: CommandItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        item.description = element.description;
        item.command = {
            command: 'copilot-automator.runCommand',
            title: 'Run Command',
            arguments: [element.label]
        };
        return item;
    }

    getChildren(): Promise<CommandItem[]> {
        return Promise.resolve(this.commands);
    }
}

class CommandItem {
    constructor(
        public readonly label: string,
        public readonly description?: string
    ) {}
}

// --- LLM Models Tree View ---
class LLMModelsProvider implements vscode.TreeDataProvider<LLMModelItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LLMModelItem | null | undefined> = new vscode.EventEmitter<LLMModelItem | null | undefined>();
    readonly onDidChangeTreeData: vscode.Event<LLMModelItem | null | undefined> = this._onDidChangeTreeData.event;
    private models: string[] = [];
    private selectedModel: string | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.selectedModel = context.globalState.get('llmModel', LLM_MODEL);
    }

    async selectModel(model: string) {
        this.selectedModel = model;
        await this.context.globalState.update('llmModel', model);
        LLM_MODEL = model;
        this._onDidChangeTreeData.fire();
        vscode.window.showInformationMessage(`Selected LLM model: ${model}`);
    }

    async refresh() {
        try {
            const apiUrl = this.context.globalState.get('llmApiUrl', LLM_API_URL).replace(/\/v1\/chat\/completions$/, '/v1/models');
            const response = await axios.get(apiUrl);
            this.models = response.data.data?.map((m: any) => m.id) || [];
        } catch (e) {
            this.models = [];
            logInteraction('ERROR', 'LLM_MODELS_FETCH_FAILED', e);
        }
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: LLMModelItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        if (element.label === this.selectedModel) {
            item.description = 'Selected';
        }
        item.command = {
            command: 'copilot-automator.selectModel',
            title: 'Select Model',
            arguments: [element.label]
        };
        return item;
    }

    getChildren(): Promise<LLMModelItem[]> {
        return Promise.resolve(this.models.map(m => new LLMModelItem(m)));
    }
}

class LLMModelItem {
    constructor(public readonly label: string) {}
}

// --- Settings Panel ---
function openSettingsPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorSettings',
        'Copilot Automator Settings',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const settings = {
        llmApiUrl: context.globalState.get('llmApiUrl', LLM_API_URL),
        llmModel: context.globalState.get('llmModel', LLM_MODEL),
        llmTemp: context.globalState.get('llmTemp', LLM_TEMPERATURE),
        maxPrompts: context.globalState.get('maxPrompts', MAX_PROMPTS_PER_SESSION),
        contextSource: context.globalState.get('contextSource', 'editor'),
        fileReviewPaths: context.globalState.get('fileReviewPaths', ''),
        specResourceUrls: context.globalState.get('specResourceUrls', ''),
        llmEndpoints: LLM_ENDPOINTS
    };
    panel.webview.html = getSettingsHtml(settings);
    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'saveSettings') {
            await context.globalState.update('llmApiUrl', msg.llmApiUrl);
            await context.globalState.update('llmModel', msg.llmModel);
            await context.globalState.update('llmTemp', msg.llmTemp);
            await context.globalState.update('maxPrompts', msg.maxPrompts);
            await context.globalState.update('contextSource', msg.contextSource);
            await context.globalState.update('fileReviewPaths', msg.fileReviewPaths);
            await context.globalState.update('specResourceUrls', msg.specResourceUrls);
            LLM_API_URL = msg.llmApiUrl;
            LLM_MODEL = msg.llmModel;
            LLM_TEMPERATURE = msg.llmTemp;
            MAX_PROMPTS_PER_SESSION = msg.maxPrompts;
            CONTEXT_SOURCE = msg.contextSource;
            FILE_REVIEW_PATHS = msg.fileReviewPaths;
            SPEC_RESOURCE_URLS = msg.specResourceUrls;
            vscode.window.showInformationMessage('Copilot Automator settings saved.');
        }
    });
}

// --- Specification Resources Panel ---
function openSpecResourcesPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorSpecResources',
        'Specification Resources',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const specResourceUrls = context.globalState.get('specResourceUrls', '') as string;
    let urls: string[] = [];
    if (specResourceUrls) {
        urls = specResourceUrls.split(',').map((url: string) => url.trim());
    }
    panel.webview.html = getSpecResourcesHtml(urls);
    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'saveSpecUrls') {
            const newUrls = msg.urls.join(',');
            await context.globalState.update('specResourceUrls', newUrls);
            SPEC_RESOURCE_URLS = newUrls;
            vscode.window.showInformationMessage('Specification resource URLs saved.');
        }
    });
}

function getSpecResourcesHtml(urls: string[]): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Specification Resources</title>
            <style>
                body { font-family: sans-serif; margin: 1em; }
                ul { list-style: none; padding: 0; }
                li { margin: 0.5em 0; display: flex; align-items: center; }
                input { flex-grow: 1; margin-right: 0.5em; padding: 0.3em; }
                button { padding: 0.3em 0.6em; }
                #addUrl { margin-top: 1em; }
            </style>
        </head>
        <body>
            <h2>Specification Resources</h2>
            <ul id="urlList">
                ${urls.map((url, index) => `
                    <li>
                        <input type="text" value="${url}" data-index="${index}" />
                        <button onclick="removeUrl(${index})">Remove</button>
                    </li>
                `).join('')}
            </ul>
            <button id="addUrl">Add URL</button>
            <button onclick="saveUrls()">Save</button>
            <script>
                const vscode = acquireVsCodeApi();
                const urlList = document.getElementById('urlList');
                document.getElementById('addUrl').onclick = () => {
                    const li = document.createElement('li');
                    li.innerHTML = '<input type="text" placeholder="Enter URL" data-index="' + urlList.children.length + '" /><button onclick="removeUrl(' + urlList.children.length + ')">Remove</button>';
                    urlList.appendChild(li);
                };
                function removeUrl(index) {
                    const li = urlList.querySelector('[data-index="' + index + '"]').parentElement;
                    urlList.removeChild(li);
                    // Reindex remaining inputs
                    Array.from(urlList.children).forEach((child, i) => {
                        child.querySelector('input').setAttribute('data-index', i);
                        child.querySelector('button').setAttribute('onclick', 'removeUrl(' + i + ')');
                    });
                }
                function saveUrls() {
                    const urls = Array.from(urlList.querySelectorAll('input')).map(input => input.value.trim()).filter(url => url);
                    vscode.postMessage({ command: 'saveSpecUrls', urls });
                }
            </script>
        </body>
        </html>
    `;
}

// --- Activity Bar View Provider ---
class AutomatorPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'copilotAutomatorPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
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
            <button id="goBtn" title="Start automation/cooperation" aria-label="Go" class="transition bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center"><span class="mr-1">▶️</span>Go</button>
            <button id="pauseBtn" title="Pause automation/cooperation" aria-label="Pause" class="transition bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center"><span class="mr-1">⏸️</span>Pause</button>
            <button id="resumeBtn" title="Resume automation/cooperation" aria-label="Resume" class="transition bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center"><span class="mr-1">▶️</span>Resume</button>
            <button id="stopBtn" title="Stop automation/cooperation" aria-label="Stop" class="transition bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center"><span class="mr-1">⏹️</span>Stop</button>
            <button id="settingsBtn" title="Open settings panel" aria-label="Settings" class="transition bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center"><span class="mr-1">⚙️</span>Settings</button>
            <button id="selectFilesBtn" title="Select files for LLM review" aria-label="Select Files" class="transition bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 flex items-center"><span class="mr-1">📂</span>Select Files</button>
            <button id="specResourcesBtn" title="Manage specification resource URLs" aria-label="Spec Resources" class="transition bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center"><span class="mr-1">📜</span>Spec Resources</button>
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
        document.getElementById('goBtn').onclick = () => {
        document.getElementById('pauseBtn').onclick = () => {
            vscode.postMessage({ command: 'pause' });
            addDialogue('User: Pause');
        };
        document.getElementById('resumeBtn').onclick = () => {
            vscode.postMessage({ command: 'resume' });
            addDialogue('User: Resume');
        };
            vscode.postMessage({ command: 'start' });
            addDialogue('User: Go');
        };
        document.getElementById('stopBtn').onclick = () => {
            vscode.postMessage({ command: 'stop' });
            addDialogue('User: Stop');
        };
        document.getElementById('settingsBtn').onclick = () => {
            vscode.postMessage({ command: 'openSettings' });
        };
        document.getElementById('selectFilesBtn').onclick = () => {
            vscode.postMessage({ command: 'selectFiles' });
            addDialogue('User: Select Files for Review');
        };
        document.getElementById('specResourcesBtn').onclick = () => {
            vscode.postMessage({ command: 'manageSpecResources' });
            addDialogue('User: Manage Specification Resources');
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
            setTimeout(() => { div.classList.remove('opacity-0'); div.classList.add('opacity-100'); }, 10);
            dialogue.scrollTop = dialogue.scrollHeight;
        }
    </script>
</body>
</html>`;
    }

    dispose() {
        // No resources to clean up
    }
}

// --- Configurable constants (persistent) ---
let MAX_PROMPTS_PER_SESSION = 10;
let LLM_API_URL = 'http://localhost:1234/v1/chat/completions';
let LLM_MODEL = 'your-model-name';
let LLM_TEMPERATURE = 0.7;
let CONTEXT_SOURCE = 'editor';
let FILE_REVIEW_PATHS: string = '';
let SPEC_RESOURCE_URLS = ''; // Comma-separated URLs
let LLM_ENDPOINTS: { label: string; url: string }[] = [
    { label: 'Copilot (default)', url: 'http://localhost:1234/v1/chat/completions' },
    { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
    { label: 'Grok', url: 'https://grok.api.example.com/v1/chat/completions' }
];
const PROMPT_DELAY_MS = 2000;

// --- State ---
let promptCount = 0;
let automationActive = false;
let automationLoop: NodeJS.Timeout | undefined;
let automationPaused = false;
let automationGoal: string | undefined;
let logFilePath: string;
let selectedFiles: string[] = [];

// --- Flexible File Selection ---
async function flexibleFileSelection(context: vscode.ExtensionContext) {
    const options = [
        'Multi-select files',
        'Enter glob pattern',
        'Manual file path entry'
    ];
    const choice = await vscode.window.showQuickPick(options, { placeHolder: 'How would you like to select files for LLM review?' });
    if (!choice) return;
    let files: string[] = [];
    if (choice === 'Multi-select files') {
        const uris = await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, openLabel: 'Select Files for LLM Review' });
        if (uris && uris.length > 0) {
            files = uris.map(u => u.fsPath);
        }
    } else if (choice === 'Enter glob pattern') {
        const pattern = await vscode.window.showInputBox({ prompt: 'Enter a glob pattern (e.g., src/**/*.ts)' });
        if (pattern) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const root = workspaceFolders[0].uri.fsPath;
                const matches = glob.sync(pattern, { cwd: root, absolute: true });
                files = matches;
            }
        }
    } else if (choice === 'Manual file path entry') {
        const input = await vscode.window.showInputBox({ prompt: 'Enter file paths, comma-separated' });
        if (input) {
                llmEndpoints: LLM_ENDPOINTS
            files = input.split(',').map(f => f.trim()).filter(Boolean);
        }
    }
    if (files.length > 0) {
        selectedFiles = files;
        const fileNames = selectedFiles.map(f => path.basename(f)).join(', ');
        logInteraction('INFO', 'FLEXIBLE_FILES_SELECTED', `Selected files: ${fileNames}`);
        vscode.window.showInformationMessage(`Selected ${selectedFiles.length} file(s) for LLM review.`);
    } else {
        vscode.window.showWarningMessage('No files selected.');
    }
}

// --- Prompt History ---
interface PromptHistoryEntry {
    prompt: string;
    response?: string;
    timestamp: string;
}
let promptHistory: PromptHistoryEntry[] = [];

function addPromptHistory(prompt: string, response?: string) {
    promptHistory.push({ prompt, response, timestamp: new Date().toISOString() });
    if (promptHistory.length > 100) promptHistory.shift();
}

function getPromptHistory(limit = 10): PromptHistoryEntry[] {
    return promptHistory.slice(-limit);
}

// --- Constants ---
function getSettingsHtml(settings: { llmApiUrl: string, llmModel: string, llmTemp: number, maxPrompts: number, contextSource: string, fileReviewPaths: string, specResourceUrls: string, llmEndpoints: { label: string; url: string }[] }): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Copilot Automator Settings</title>
            <style>
                body { font-family: sans-serif; margin: 1em; }
                label { display: block; margin: 0.5em 0; }
                input, select { width: 100%; padding: 0.3em; }
                button { margin-top: 1em; padding: 0.5em 1em; }
            </style>
        </head>
        <body>
            <h2>Copilot Automator Settings</h2>
            <form onsubmit="event.preventDefault(); saveSettings();">
                <label>LLM API URL: <input type="text" id="llmApiUrl" value="${settings.llmApiUrl}" /></label>
                <label>LLM Endpoint:
                    <select id="llmEndpoint">
                        ${settings.llmEndpoints.map(e => `<option value="${e.url}" ${e.url === settings.llmApiUrl ? 'selected' : ''}>${e.label}</option>`).join('')}
                    </select>
                    <button type="button" onclick="selectLlmEndpoint()">Set Endpoint</button>
                </label>
                <label>Model: <input type="text" id="llmModel" value="${settings.llmModel}" /></label>
                <label>Temperature: <input type="number" id="llmTemp" value="${settings.llmTemp}" step="0.01" min="0" max="2" /></label>
                <label>Max Prompts/Session: <input type="number" id="maxPrompts" value="${settings.maxPrompts}" min="1" max="100" /></label>
                <label>Context Source: 
                    <select id="contextSource">
                        <option value="editor" ${settings.contextSource === 'editor' ? 'selected' : ''}>Active Editor</option>
                        <option value="chat" ${settings.contextSource === 'chat' ? 'selected' : ''}>Copilot Chat (if available)</option>
                    </select>
                </label>
                <label>File Review Paths (e.g., src/*.ts): <input type="text" id="fileReviewPaths" value="${settings.fileReviewPaths}" placeholder="Comma-separated paths or patterns" /></label>
                <label>Specification Resource URLs (comma-separated): <input type="text" id="specResourceUrls" value="${settings.specResourceUrls}" placeholder="e.g., https://example.com/spec" /></label>
                <button type="submit">Save</button>
            </form>
            <script>
                const vscode = acquireVsCodeApi();
                function saveSettings() {
                    vscode.postMessage({
                        command: 'saveSettings',
                        llmApiUrl: document.getElementById('llmApiUrl').value,
                        llmModel: document.getElementById('llmModel').value,
                        llmTemp: parseFloat(document.getElementById('llmTemp').value),
                        maxPrompts: parseInt(document.getElementById('maxPrompts').value, 10),
                        contextSource: document.getElementById('contextSource').value,
                        fileReviewPaths: document.getElementById('fileReviewPaths').value,
                        specResourceUrls: document.getElementById('specResourceUrls').value,
                        llmEndpoints: ${JSON.stringify(settings.llmEndpoints)}
                    });
                }
                function selectLlmEndpoint() {
                    const url = document.getElementById('llmEndpoint').value;
                    vscode.postMessage({ command: 'selectLlmEndpoint', url });
                    document.getElementById('llmApiUrl').value = url;
                }
            </script>
        </body>
        </html>
    `;
}
const LOG_LEVEL_ERROR = 'ERROR';
const LOG_LEVEL_WARNING = 'WARNING';
const LOG_LEVEL_INFO = 'INFO';
const INSTRUCTIONS_FOLDER = 'instructions';

// --- Logging ---
function logInteraction(logLevel: string, action: string, message: any) {
    if (!logFilePath) {
        // Avoid logging if logFilePath is not initialized
        return;
    }
    const entry = {
        timestamp: new Date().toISOString(),
        logLevel,
        action,
        message
    };
    fs.appendFile(logFilePath, JSON.stringify(entry) + '\n', err => {
        if (err) {
            console.error('Failed to write log:', err);
        }
    });
}

// --- Create Instructions Folder ---
function ensureInstructionsFolder(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): string | undefined {
    if (!workspaceFolders || workspaceFolders.length === 0) return undefined;
    const root = workspaceFolders[0].uri.fsPath;
    const instructionsDir = path.join(root, INSTRUCTIONS_FOLDER);
    if (!fs.existsSync(instructionsDir)) {
        fs.mkdirSync(instructionsDir, { recursive: true });
        logInteraction(LOG_LEVEL_INFO, 'INSTRUCTIONS_FOLDER_CREATED', `Created instructions folder at ${instructionsDir}`);
    }
    return instructionsDir;
}

// --- File and Instructions Retrieval for LLM Review ---
async function getFilesForLLMReview(context: vscode.ExtensionContext): Promise<string> {
    let fileContents = '';
    let patterns: string[] = [];
    if (typeof FILE_REVIEW_PATHS === 'string' && FILE_REVIEW_PATHS) {
        patterns = FILE_REVIEW_PATHS.split(',').map(p => p.trim());
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;

    // Include instructions folder
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (instructionsDir) {
        patterns.push(path.join('instructions', '*.json'));
    }

    // Read manually selected files
    if (selectedFiles.length > 0) {
        for (const filePath of selectedFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                fileContents += `\n\nFile: ${filePath}\n${content}`;
                logInteraction('INFO', 'FILE_REVIEW', `Read file: ${filePath}`);
            } catch (err) {
                logInteraction('ERROR', 'FILE_READ_FAILED', `Failed to read file ${filePath}: ${err}`);
            }
        }
    }

    // Read files from patterns
    if (patterns.length > 0 && workspaceFolders) {
        const root = workspaceFolders[0].uri.fsPath;
        let invalidJsonFiles: string[] = [];
        for (const pattern of patterns) {
            const files = glob.sync(pattern, { cwd: root, absolute: true });
            for (const filePath of files) {
                try {
                    const stats = fs.statSync(filePath);
                    const maxSize = 1024 * 1024 * 2; // 2MB limit per file
                    let content = '';
                    if (stats.size > maxSize) {
                        // Read only the first 2MB
                        const fd = fs.openSync(filePath, 'r');
                        const buffer = Buffer.alloc(maxSize);
                        fs.readSync(fd, buffer, 0, maxSize, 0);
                        fs.closeSync(fd);
                        content = buffer.toString('utf-8') + '\n[Truncated: file too large]';
                        logInteraction('WARNING', 'FILE_TRUNCATED', `File truncated for review: ${filePath}`);
                    } else {
                        content = fs.readFileSync(filePath, 'utf-8');
                    }
                    // If file is in instructions folder and ends with .json, validate JSON
                    if (filePath.includes(path.join('instructions', '')) && filePath.endsWith('.json')) {
                        try {
                            JSON.parse(content);
                        } catch (jsonErr) {
                            logInteraction('ERROR', 'INVALID_JSON', `Invalid JSON in file: ${filePath}`);
                            invalidJsonFiles.push(filePath);
                            continue; // Skip invalid JSON file
                        }
                    }
                    fileContents += `\n\nFile: ${filePath}\n${content}`;
                    logInteraction('INFO', 'FILE_REVIEW', `Read file: ${filePath}`);
                } catch (err) {
                    logInteraction('ERROR', 'FILE_READ_FAILED', `Failed to read file ${filePath}: ${err}`);
                }
            }
        }
        if (invalidJsonFiles.length > 0) {
            fileContents += `\n\n[Warning: The following instruction files contained invalid JSON and were skipped:]\n` + invalidJsonFiles.join('\n');
        }
    }

    return fileContents || 'No file content available for review.';
}

// --- Fetch Specification Resources ---
async function fetchSpecResources(): Promise<string> {
    let specContent = '';
    const urls = SPEC_RESOURCE_URLS ? SPEC_RESOURCE_URLS.split(',').map(url => url.trim()).filter(url => url) : [];
    for (const url of urls) {
        try {
            const response = await axios.get(url, { timeout: 5000 }); // 5s timeout
            let data = response.data;
            if (typeof data === 'string' && data.length > 1024 * 1024 * 2) {
                data = data.slice(0, 1024 * 1024 * 2) + '\n[Truncated: resource too large]';
                logInteraction('WARNING', 'SPEC_RESOURCE_TRUNCATED', `Resource truncated: ${url}`);
            }
            specContent += `\n\nSpecification Resource: ${url}\n${data}`;
            logInteraction('INFO', 'SPEC_RESOURCE_FETCHED', `Fetched content from ${url}`);
        } catch (err) {
            logInteraction('ERROR', 'SPEC_RESOURCE_FETCH_FAILED', `Failed to fetch ${url}: ${err}`);
        }
    }
    return specContent || 'No specification resource content available.';
}

// --- LLM Integration ---
async function generatePromptFromLocalLLM(contextualInfo: string, fileContents: string, specContents: string, isRetry: boolean = false): Promise<string> {
    try {
        const payload = {
            model: LLM_MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: `You are an expert coding assistant. When generating the next prompt for Copilot, enclose it strictly in <copilot_instructions> and </copilot_instructions> tags. Any other thoughts, explanations, or additional content should be outside these tags. If an error occurs, consult the specification resources: ${SPEC_RESOURCE_URLS}.` 
                },
                { 
                    role: 'user', 
                    content: `${contextualInfo}\n\nFiles for review:\n${fileContents}\n\nSpecification Resources:\n${specContents}${isRetry ? '\n\nPrevious attempt failed. Review specifications and try again.' : ''}` 
                }
            ],
            temperature: LLM_TEMPERATURE
        };
        const response = await axios.post(LLM_API_URL, payload);
        let content = response.data.choices?.[0]?.message?.content || '';
        logInteraction('INFO', 'LOCAL_LLM_REQUEST', { request: payload, response: content });

        // Extract content between <copilot_instructions> tags
        const match = content.match(/<copilot_instructions>([\s\S]*?)<\/copilot_instructions>/);
        if (match && match[1]) {
            content = match[1].trim();
            logInteraction('INFO', 'PROMPT_EXTRACTED', content);
        } else {
            logInteraction('WARNING', 'NO_INSTRUCTIONS_TAG', 'No <copilot_instructions> tag found, using full content.');
        }

        return content;
    } catch (error) {
        logInteraction('ERROR', 'LOCAL_LLM_REQUEST', error);
        return '';
    }
}

// --- Copilot Chat Automation ---
async function sendPromptToChat(promptText: string, historyProvider: HistoryProvider) {
    // Add to prompt history (pre-response)
    addPromptHistory(promptText);
    // Approval step
    const approval = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Approve sending this prompt to Copilot? "${promptText}"`
    });
    if (approval !== 'Yes') {
        logInteraction('INFO', 'PROMPT_DENIED', promptText);
        historyProvider.add(new HistoryItem('Prompt Denied', promptText));
        return;
    }

    // Check for sensitive actions like 'run'
    if (promptText.toLowerCase().includes('run')) {
        const runApproval = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: `This prompt includes a potential run request. Proceed? "${promptText}"`
        });
        if (runApproval !== 'Yes') {
            logInteraction('INFO', 'RUN_REQUEST_DENIED', promptText);
            historyProvider.add(new HistoryItem('Run Request Denied', promptText));
            return;
        }
    }

    if (promptCount >= MAX_PROMPTS_PER_SESSION) {
        await vscode.commands.executeCommand('workbench.action.closePanel');
        promptCount = 0;
        logInteraction('INFO', 'CHAT_SESSION_RESET', 'Session reset after max prompts.');
    }
    await vscode.commands.executeCommand('workbench.action.chat.open', promptText);
    promptCount++;
    logInteraction('INFO', 'PROMPT_SENT', promptText);
    historyProvider.add(new HistoryItem('Prompt Sent', promptText));
    // Optionally, capture response if available in future
}

// --- Accept Copilot Suggestion ---
async function acceptCopilotSuggestion() {
    await new Promise(resolve => setTimeout(resolve, PROMPT_DELAY_MS));
    try {
        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
        logInteraction('INFO', 'SUGGESTION_ACCEPTED', 'Accepted inline suggestion.');
    } catch (err) {
        logInteraction('ERROR', 'SUGGESTION_ACCEPT_FAILED', err);
    }
}

// --- Read Context for Automation ---
async function getLastCopilotChatResponse(): Promise<string> {
    if (CONTEXT_SOURCE === 'chat') {
        // TODO: When VS Code exposes Copilot Chat API, fetch the last chat response here.
        logInteraction('INFO', 'CONTEXT_SOURCE', 'Chat context not yet supported. Falling back to prompt history.');
        // Use prompt history as fallback context
        const last = promptHistory.length > 0 ? promptHistory[promptHistory.length - 1] : undefined;
        if (last && last.response) {
            return last.response;
        } else if (last) {
            return last.prompt;
        }
        // Fallback to editor context if no prompt history
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        const selectedText = document.getText(selection);
        const context = selectedText || document.getText();
        logInteraction('INFO', 'CONTEXT_SOURCE', 'Using editor context.');
        return context || 'No content in active editor.';
    }
    logInteraction('WARNING', 'CONTEXT_SOURCE', 'No active editor found.');
    return 'No active editor context available.';
}

// --- Main Automation Loop ---
async function automationMainLoop(goal: string, historyProvider: HistoryProvider, context: vscode.ExtensionContext) {
    while (automationActive) {
        if (automationPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }
        const lastResponse = await getLastCopilotChatResponse();
        const fileContents = await getFilesForLLMReview(context);
        const specContents = await fetchSpecResources();
        if (lastResponse.includes('No active editor')) {
            historyProvider.add(new HistoryItem('Warning', 'No editor context available for prompt generation.'));
        }
        if (fileContents === 'No file content available for review.') {
            historyProvider.add(new HistoryItem('Warning', 'No files selected or matched for LLM review.'));
        }
        if (specContents === 'No specification resource content available.') {
            historyProvider.add(new HistoryItem('Warning', 'No specification resources available.'));
        }
        const contextualInfo = lastResponse.includes('No active editor') || lastResponse.includes('not available')
            ? `Current goal: ${goal}. No prior response available.`
            : `Prior response: ${lastResponse}. Goal: ${goal}.`;
        let nextPrompt = await generatePromptFromLocalLLM(contextualInfo, fileContents, specContents);
        if (!nextPrompt) {
            // Retry with specification resources if prompt generation fails
            historyProvider.add(new HistoryItem('Warning', 'Failed to generate prompt, retrying with specifications.'));
            nextPrompt = await generatePromptFromLocalLLM(contextualInfo, fileContents, specContents, true);
        }
        if (nextPrompt) {
            await sendPromptToChat(nextPrompt, historyProvider);
            await acceptCopilotSuggestion();
        } else {
            historyProvider.add(new HistoryItem('Error', 'Failed to generate next prompt.'));
            logInteraction('ERROR', 'PROMPT_GENERATION_FAILED', 'No prompt returned from LLM.');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// --- Automation File Discovery ---
function findAutomationFile(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined, userPath?: string): string | undefined {
    if (userPath && fs.existsSync(userPath) && userPath.endsWith('.json')) {
        return userPath;
    }
    if (!workspaceFolders || workspaceFolders.length === 0) return undefined;
    const root = workspaceFolders[0].uri.fsPath;
    const candidates = glob.sync('{automation*.json,*.automation.json}', { cwd: root, absolute: true });
    return candidates.length > 0 ? candidates[0] : undefined;
}

// --- Extension Activation ---
export function activate(context: vscode.ExtensionContext) {
    // Restore session state if present
    automationPaused = context.globalState.get('automationPaused', false);
    automationGoal = context.globalState.get('automationGoal', undefined);

    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.pause', async () => {
            if (automationActive && !automationPaused) {
                automationPaused = true;
                await context.globalState.update('automationPaused', true);
                vscode.window.showInformationMessage('Copilot Automator paused.');
            }
        }),
        vscode.commands.registerCommand('copilot-automator.resume', async () => {
            if (automationActive && automationPaused) {
                automationPaused = false;
                await context.globalState.update('automationPaused', false);
                vscode.window.showInformationMessage('Copilot Automator resumed.');
                if (automationGoal) {
                    automationLoop = setTimeout(() => automationMainLoop(automationGoal!, historyProvider, context), 0);
                }
            }
        })
    );
    // Register log viewer command
    const openLogViewerCmd = vscode.commands.registerCommand('copilot-automator.openLogViewer', () => {
        openLogViewerPanel(context);
    });
    context.subscriptions.push(openLogViewerCmd);
        // Register create template instruction command
        const createTemplateCmd = vscode.commands.registerCommand('copilot-automator.createTemplateInstruction', () => {
            createTemplateInstructionFile(context);
        });
        context.subscriptions.push(createTemplateCmd);
        // Register validate instructions command
        const validateInstructionsCmd = vscode.commands.registerCommand('copilot-automator.validateInstructions', () => {
            validateAllInstructionFiles(context);
        });
        context.subscriptions.push(validateInstructionsCmd);
        // Register run automation from instruction file command
        const runInstructionCmd = vscode.commands.registerCommand('copilot-automator.runInstructionFile', () => {
            runAutomationFromInstructionFile(context, historyProvider);
        });
        context.subscriptions.push(runInstructionCmd);
    // ...existing code...
    const historyProvider = new HistoryProvider();
    vscode.window.registerTreeDataProvider('copilotAutomatorHistory', historyProvider);

    const commandsJson = require(context.asAbsolutePath('copilot-automator-commands.json'));
    const commandsProvider = new CommandsProvider(commandsJson);
    vscode.window.registerTreeDataProvider('copilotAutomatorCommands', commandsProvider);
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.runCommand', async (cmd: string) => {
            historyProvider.add(new HistoryItem(`Command: ${cmd}`, 'Clicked in Available Commands'));
            // Map command names to actions
            switch (cmd) {
                case 'start':
                    await vscode.commands.executeCommand('copilot-automator.start');
                    break;
                case 'stop':
                    await vscode.commands.executeCommand('copilot-automator.stop');
                    break;
                case 'openSettings':
                    await vscode.commands.executeCommand('copilot-automator.openSettings');
                    break;
                case 'sendPrompt':
                    // Prompt user for input and send to chat
                    const prompt = await vscode.window.showInputBox({ prompt: 'Enter prompt to send to Copilot Chat:' });
                    if (prompt) {
                        await sendPromptToChat(prompt, historyProvider);
                    }
                    break;
                case 'acceptSuggestion':
                    await acceptCopilotSuggestion();
                    break;
                case 'logInteraction':
                    const logMsg = await vscode.window.showInputBox({ prompt: 'Enter log message:' });
                    if (logMsg) {
                        logInteraction('INFO', 'USER_LOG', logMsg);
                        vscode.window.showInformationMessage('Log entry added.');
                    }
                    break;
                default:
                    vscode.window.showWarningMessage(`No action implemented for command: ${cmd}`);
            }
        })
    );

    const modelsProvider = new LLMModelsProvider(context);
    vscode.window.registerTreeDataProvider('copilotAutomatorModels', modelsProvider);
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.refreshModels', () => modelsProvider.refresh()),
        vscode.commands.registerCommand('copilot-automator.selectModel', async (model: string) => {
            await modelsProvider.selectModel(model);
        })
    );
    modelsProvider.refresh();

    function postDialogue(text: string) {
        for (const sub of context.subscriptions) {
            if (sub instanceof AutomatorPanelProvider && sub['_view']) {
                sub['_view'].webview.postMessage({ type: 'dialogue', text });
            }
        }
        historyProvider.add(new HistoryItem(text, 'Dialogue'));
    }

    logFilePath = path.join(context.extensionPath, 'copilot_interactions.log');

    LLM_API_URL = context.globalState.get('llmApiUrl', LLM_API_URL);
    LLM_MODEL = context.globalState.get('llmModel', LLM_MODEL);
    LLM_TEMPERATURE = context.globalState.get('llmTemp', LLM_TEMPERATURE);
    MAX_PROMPTS_PER_SESSION = context.globalState.get('maxPrompts', MAX_PROMPTS_PER_SESSION);
    CONTEXT_SOURCE = context.globalState.get('contextSource', 'editor');
    FILE_REVIEW_PATHS = context.globalState.get('fileReviewPaths', '');
    SPEC_RESOURCE_URLS = context.globalState.get('specResourceUrls', '');

    const provider = new AutomatorPanelProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(AutomatorPanelProvider.viewType, provider)
    );

    provider['_view']?.webview.onDidReceiveMessage?.((msg: any) => {
        if (msg.command === 'start') {
            vscode.commands.executeCommand('copilot-automator.start');
        } else if (msg.command === 'stop') {
            vscode.commands.executeCommand('copilot-automator.stop');
        } else if (msg.command === 'openSettings') {
            vscode.commands.executeCommand('copilot-automator.openSettings');
        } else if (msg.command === 'selectFiles') {
            vscode.commands.executeCommand('copilot-automator.selectFiles');
        } else if (msg.command === 'manageSpecResources') {
            vscode.commands.executeCommand('copilot-automator.manageSpecResources');
        } else if (msg.command === 'sendCommand') {
            // Send the user input directly to the LLM endpoint and show the result
            (async () => {
                const prompt = msg.value;
                postDialogue('User: ' + prompt);
                try {
                    // Compose a minimal payload for the LLM
                    const payload = {
                        model: LLM_MODEL,
                        messages: [
                            { role: 'user', content: prompt }
                        ],
                        temperature: LLM_TEMPERATURE
                    };
                    const response = await axios.post(LLM_API_URL, payload);
                    let content = response.data.choices?.[0]?.message?.content || '';
                    postDialogue('LLM: ' + content);
                    logInteraction('INFO', 'SEND_BOX_LLM_RESPONSE', content);
                } catch (err) {
                    postDialogue('Error: Failed to get response from LLM.');
                    logInteraction('ERROR', 'SEND_BOX_LLM_ERROR', err);
                }
            })();
        }
    });

    const startCmd = vscode.commands.registerCommand('copilot-automator.start', async () => {
        if (automationActive) {
            vscode.window.showInformationMessage('Copilot Automator is already running.');
            return;
        }
        automationActive = true;
        automationPaused = false;
        promptCount = 0;
        const goal = await vscode.window.showInputBox({ prompt: 'What is your automation goal for Copilot?' });
        if (!goal) {
            vscode.window.showWarningMessage('No goal provided. Automation cancelled.');
            automationActive = false;
            return;
        }
        automationGoal = goal;
        await context.globalState.update('automationGoal', goal);
        await context.globalState.update('automationPaused', false);
        logInteraction('INFO', 'AUTOMATION_STARTED', goal);
        historyProvider.add(new HistoryItem('Automation started', goal));
        automationLoop = setTimeout(() => automationMainLoop(goal, historyProvider, context), 0);
    });

    const stopCmd = vscode.commands.registerCommand('copilot-automator.stop', () => {
        automationActive = false;
        automationPaused = false;
        automationGoal = undefined;
        context.globalState.update('automationPaused', false);
        context.globalState.update('automationGoal', undefined);
        if (automationLoop) {
            clearTimeout(automationLoop);
            automationLoop = undefined;
        }
        logInteraction('INFO', 'AUTOMATION_STOPPED', 'Automation stopped by user.');
        historyProvider.add(new HistoryItem('Automation stopped', 'Stopped by user'));
        vscode.window.showInformationMessage('Copilot Automator stopped.');
    });

    const openSettingsCmd = vscode.commands.registerCommand('copilot-automator.openSettings', () => {
        openSettingsPanel(context);
    });

    const selectFilesCmd = vscode.commands.registerCommand('copilot-automator.selectFiles', async () => {
        await flexibleFileSelection(context);
        if (selectedFiles.length > 0) {
            const fileNames = selectedFiles.map(f => path.basename(f)).join(', ');
            historyProvider.add(new HistoryItem('Files Selected', fileNames));
        } else {
            historyProvider.add(new HistoryItem('No Files Selected', 'File selection cancelled.'));
        }
    });

    const manageSpecResourcesCmd = vscode.commands.registerCommand('copilot-automator.manageSpecResources', () => {
        openSpecResourcesPanel(context);
    });

    context.subscriptions.push(startCmd, stopCmd, openSettingsCmd, selectFilesCmd, manageSpecResourcesCmd);
}

export function deactivate() {
    automationActive = false;
    if (automationLoop) {
        clearTimeout(automationLoop);
        automationLoop = undefined;
    }
}