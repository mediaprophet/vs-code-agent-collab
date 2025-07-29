import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// --- Automation History / Logs Tree View ---
class HistoryItem {
    constructor(
        public readonly label: string,
        public readonly description?: string,
        public readonly command?: vscode.Command
    ) {}
}

class HistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem | undefined | void> = new vscode.EventEmitter<HistoryItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | void> = this._onDidChangeTreeData.event;
    private history: HistoryItem[] = [];
    private static readonly CONTROL_ITEMS = [
        new HistoryItem('▶️ Start Agent Cooperation', '', {
            command: 'copilot-automator.start',
            title: 'Start Agent Cooperation'
        }),
        new HistoryItem('⏹️ Stop Agent Cooperation', '', {
            command: 'copilot-automator.stop',
            title: 'Stop Agent Cooperation'
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

    getChildren(): Thenable<HistoryItem[]> {
        return Promise.resolve([
            ...HistoryProvider.CONTROL_ITEMS,
            ...this.history
        ]);
    }
}

// --- Available Commands Tree View ---
class CommandsProvider implements vscode.TreeDataProvider<CommandItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandItem | undefined | void> = new vscode.EventEmitter<CommandItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<CommandItem | undefined | void> = this._onDidChangeTreeData.event;
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

    getChildren(): Thenable<CommandItem[]> {
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
    private _onDidChangeTreeData: vscode.EventEmitter<LLMModelItem | undefined | void> = new vscode.EventEmitter<LLMModelItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<LLMModelItem | undefined | void> = this._onDidChangeTreeData.event;
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

    getChildren(): Thenable<LLMModelItem[]> {
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
        specResourceUrls: context.globalState.get('specResourceUrls', '')
    };
    panel.webview.html = getSettingsHtml(settings);
    panel.webview.onDidReceiveMessage(async (msg) => {
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

function getSettingsHtml(settings: { llmApiUrl: string, llmModel: string, llmTemp: number, maxPrompts: number, contextSource: string, fileReviewPaths: string, specResourceUrls: string }): string {
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
                        specResourceUrls: document.getElementById('specResourceUrls').value
                    });
                }
            </script>
        </body>
        </html>
    `;
}

// --- Specification Resources Panel ---
function openSpecResourcesPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorSpecResources',
        'Specification Resources',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const specResourceUrls = context.globalState.get<string>('specResourceUrls', '');
    const urls = specResourceUrls ? specResourceUrls.split(',').map((url: string) => url.trim()) : [];
    panel.webview.html = getSpecResourcesHtml(urls);
    panel.webview.onDidReceiveMessage(async (msg) => {
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
    <style>
        body { font-family: sans-serif; margin: 1em; }
        #dialogue { border: 1px solid #ccc; padding: 0.5em; height: 120px; overflow-y: auto; background: #f9f9f9; margin-bottom: 1em; }
        #controls { margin-bottom: 1em; }
        button { margin-right: 0.5em; padding: 0.5em 1em; }
        input { padding: 0.3em; }
    </style>
</head>
<body>
    <h2>Copilot Automator</h2>
    <div id="controls">
        <button id="goBtn">Go</button>
        <button id="stopBtn">Stop</button>
        <button id="settingsBtn">Settings</button>
        <button id="selectFilesBtn">Select Files for Review</button>
        <button id="specResourcesBtn">Spec Resources</button>
    </div>
    <div id="dialogue"></div>
    <form id="commandForm">
        <input type="text" id="commandInput" placeholder="Type a command (e.g., sendPrompt)" style="width:70%" />
        <button type="submit">Send</button>
    </form>
    <script>
        const vscode = acquireVsCodeApi();
        const dialogue = document.getElementById('dialogue');
        document.getElementById('goBtn').onclick = () => {
            vscode.postMessage({ command: 'start' });
            addDialogue('User: Go');
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
            dialogue.innerHTML += '<div>' + text + '</div>';
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
let FILE_REVIEW_PATHS = '';
let SPEC_RESOURCE_URLS = ''; // Comma-separated URLs
const PROMPT_DELAY_MS = 2000;

// --- State ---
let promptCount = 0;
let agentCooperationActive = false;
let agentCooperationLoop: NodeJS.Timeout | undefined;
let logFilePath: string;
let selectedFiles: string[] = [];

// --- Logging ---
function logInteraction(logLevel: string, action: string, message: any) {
    const entry = {
        timestamp: new Date().toISOString(),
        logLevel,
        action,
        message
    };
    fs.appendFile(logFilePath, JSON.stringify(entry) + '\n', err => {
        if (err) {
            console.error('Failed to write log:', err);
            vscode.window.showErrorMessage(`Failed to write to log file: ${err.message}`);
        }
    });
}

// --- Create Instructions Folder ---
function ensureInstructionsFolder(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): string | undefined {
    if (!workspaceFolders || workspaceFolders.length === 0) {
        logInteraction('WARNING', 'NO_WORKSPACE', 'No workspace folders found for instructions folder creation.');
        vscode.window.showWarningMessage('No workspace open. Cannot create instructions folder.');
        return undefined;
    }
    const root = workspaceFolders[0].uri.fsPath;
    const instructionsDir = path.join(root, 'instructions');
    try {
        if (!fs.existsSync(instructionsDir)) {
            fs.mkdirSync(instructionsDir, { recursive: true });
            logInteraction('INFO', 'INSTRUCTIONS_FOLDER_CREATED', `Created instructions folder at ${instructionsDir}`);
            vscode.window.showInformationMessage(`Created instructions folder at ${instructionsDir}`);
        }
    } catch (err) {
        logInteraction('ERROR', 'INSTRUCTIONS_FOLDER_CREATION_FAILED', err);
        const errorMsg = (err instanceof Error) ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to create instructions folder: ${errorMsg}`);
        return undefined;
    }
    return instructionsDir;
}

// --- File and Instructions Retrieval for LLM Review ---
async function getFilesForLLMReview(context: vscode.ExtensionContext): Promise<string> {
    let fileContents = '';
    const patterns = FILE_REVIEW_PATHS ? FILE_REVIEW_PATHS.split(',').map(p => p.trim()) : [];
    const workspaceFolders = vscode.workspace.workspaceFolders;

    // Include instructions folder
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (instructionsDir) {
        patterns.push(path.join('instructions', '*.json'));
    }

    // Read manually selected files
    if (selectedFiles.length > 0) {
        for (const filePath of selectedFiles) {
            // Restrict to workspace paths
            if (workspaceFolders && !filePath.startsWith(workspaceFolders[0].uri.fsPath)) {
                logInteraction('WARNING', 'FILE_ACCESS_DENIED', `File ${filePath} is outside workspace.`);
                vscode.window.showWarningMessage(`File ${path.basename(filePath)} is outside workspace and will be skipped.`);
                continue;
            }
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                // Validate JSON for instructions folder files
                if (filePath.startsWith(path.join(workspaceFolders?.[0].uri.fsPath || '', 'instructions')) && filePath.endsWith('.json')) {
                    try {
                        JSON.parse(content);
                    } catch (err) {
                        const errorMsg = (err instanceof Error) ? err.message : String(err);
                        logInteraction('ERROR', 'INVALID_JSON', `Invalid JSON in ${filePath}: ${errorMsg}`);
                        vscode.window.showErrorMessage(`Invalid JSON in ${path.basename(filePath)}: ${errorMsg}`);
                        continue;
                    }
                }
                fileContents += `\n\nFile: ${filePath}\n${content}`;
                logInteraction('INFO', 'FILE_REVIEW', `Read file: ${filePath}`);
            } catch (err) {
                const errorMsg = (err instanceof Error) ? err.message : String(err);
                logInteraction('ERROR', 'FILE_READ_FAILED', `Failed to read file ${filePath}: ${errorMsg}`);
                vscode.window.showErrorMessage(`Failed to read file ${path.basename(filePath)}: ${errorMsg}`);
            }
        }
    }

    // Read files from patterns
    if (patterns.length > 0 && workspaceFolders) {
        const root = workspaceFolders[0].uri.fsPath;
        for (const pattern of patterns) {
            try {
                const files = glob.sync(pattern, { cwd: root, absolute: true });
                for (const filePath of files) {
                    // Restrict to workspace paths
                    if (!filePath.startsWith(root)) {
                        logInteraction('WARNING', 'FILE_ACCESS_DENIED', `File ${filePath} is outside workspace.`);
                        vscode.window.showWarningMessage(`File ${path.basename(filePath)} is outside workspace and will be skipped.`);
                        continue;
                    }
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        // Validate JSON for instructions folder files
                        if (filePath.startsWith(path.join(root, 'instructions')) && filePath.endsWith('.json')) {
                            try {
                                JSON.parse(content);
                            } catch (err) {
                                const errorMsg = (err instanceof Error) ? err.message : String(err);
                                logInteraction('ERROR', 'INVALID_JSON', `Invalid JSON in ${filePath}: ${errorMsg}`);
                                vscode.window.showErrorMessage(`Invalid JSON in ${path.basename(filePath)}: ${errorMsg}`);
                                continue;
                            }
                        }
                        fileContents += `\n\nFile: ${filePath}\n${content}`;
                        logInteraction('INFO', 'FILE_REVIEW', `Read file: ${filePath}`);
                    } catch (err) {
                        const errorMsg = (err instanceof Error) ? err.message : String(err);
                        logInteraction('ERROR', 'FILE_READ_FAILED', `Failed to read file ${filePath}: ${errorMsg}`);
                        vscode.window.showErrorMessage(`Failed to read file ${path.basename(filePath)}: ${errorMsg}`);
                    }
                }
            } catch (err) {
                const errorMsg = (err instanceof Error) ? err.message : String(err);
                logInteraction('ERROR', 'PATTERN_PROCESSING_FAILED', `Failed to process pattern ${pattern}: ${errorMsg}`);
                vscode.window.showErrorMessage(`Failed to process file pattern ${pattern}: ${errorMsg}`);
            }
        }
    }

    if (!fileContents) {
        logInteraction('INFO', 'NO_FILES_REVIEWED', 'No files selected or matched for LLM review.');
        vscode.window.showInformationMessage('No files available for LLM review.');
    }
    return fileContents || 'No file content available for review.';
}

// --- Fetch Specification Resources ---
async function fetchSpecResources(): Promise<string> {
    let specContent = '';
    const urls = SPEC_RESOURCE_URLS ? SPEC_RESOURCE_URLS.split(',').map(url => url.trim()).filter(url => url) : [];
    for (const url of urls) {
        // Validate and sanitize URLs
        try {
            new URL(url); // Basic URL validation
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new Error('Invalid protocol');
            }
        } catch (err) {
            const errorMsg = (err instanceof Error) ? err.message : String(err);
            logInteraction('ERROR', 'INVALID_URL', `Invalid URL ${url}: ${errorMsg}`);
            vscode.window.showErrorMessage(`Invalid URL ${url}: ${errorMsg}`);
            continue;
        }
        try {
            const response = await axios.get(url, { timeout: 5000 }); // 5-second timeout
            specContent += `\n\nSpecification Resource: ${url}\n${response.data}`;
            logInteraction('INFO', 'SPEC_RESOURCE_FETCHED', `Fetched content from ${url}`);
        } catch (err) {
            const errorMsg = (err instanceof Error) ? err.message : String(err);
            logInteraction('ERROR', 'SPEC_RESOURCE_FETCH_FAILED', `Failed to fetch ${url}: ${errorMsg}`);
            vscode.window.showErrorMessage(`Failed to fetch specification resource ${url}: ${errorMsg}`);
        }
    }
    if (!specContent) {
        logInteraction('INFO', 'NO_SPEC_RESOURCES', 'No specification resources available.');
        vscode.window.showInformationMessage('No specification resources available.');
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
            vscode.window.showWarningMessage('No <copilot_instructions> tags found in LLM response.');
        }

        return content;
    } catch (error) {
        const errorMsg = (error instanceof Error) ? error.message : String(error);
        logInteraction('ERROR', 'LOCAL_LLM_REQUEST', errorMsg);
        vscode.window.showErrorMessage(`LLM request failed: ${errorMsg}`);
        return '';
    }
}

// --- Copilot Chat Automation ---
async function sendPromptToChat(promptText: string, historyProvider: HistoryProvider) {
    if (!promptText) {
        logInteraction('ERROR', 'INVALID_PROMPT', 'Empty prompt provided.');
        vscode.window.showErrorMessage('Cannot send empty prompt to Copilot.');
        return;
    }

    // Approval step
    const approval = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Approve sending this prompt to Copilot? "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`
    });
    if (approval !== 'Yes') {
        logInteraction('INFO', 'PROMPT_DENIED', promptText);
        historyProvider.add(new HistoryItem('Prompt Denied', promptText.substring(0, 50)));
        vscode.window.showInformationMessage('Prompt denied by user.');
        return;
    }

    // Check for sensitive actions like 'run'
    if (promptText.toLowerCase().includes('run')) {
        const runApproval = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: `This prompt includes a potential run request. Proceed? "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`
        });
        if (runApproval !== 'Yes') {
            logInteraction('INFO', 'RUN_REQUEST_DENIED', promptText);
            historyProvider.add(new HistoryItem('Run Request Denied', promptText.substring(0, 50)));
            vscode.window.showInformationMessage('Run request denied by user.');
            return;
        }
    }

    if (promptCount >= MAX_PROMPTS_PER_SESSION) {
        try {
            await vscode.commands.executeCommand('workbench.action.closePanel');
            promptCount = 0;
            logInteraction('INFO', 'CHAT_SESSION_RESET', 'Session reset after max prompts.');
            vscode.window.showInformationMessage('Chat session reset.');
        } catch (err) {
            const errorMsg = (err instanceof Error) ? err.message : String(err);
            logInteraction('ERROR', 'SESSION_RESET_FAILED', errorMsg);
            vscode.window.showErrorMessage(`Failed to reset chat session: ${errorMsg}`);
        }
    }
    try {
        await vscode.commands.executeCommand('workbench.action.chat.open', promptText);
        promptCount++;
        logInteraction('INFO', 'PROMPT_SENT', promptText);
        historyProvider.add(new HistoryItem('Prompt Sent', promptText.substring(0, 50)));
        vscode.window.showInformationMessage('Prompt sent to Copilot.');
    } catch (err) {
        const errorMsg = (err instanceof Error) ? err.message : String(err);
        logInteraction('ERROR', 'PROMPT_SEND_FAILED', errorMsg);
        vscode.window.showErrorMessage(`Failed to send prompt: ${errorMsg}`);
    }
}

// --- Accept Copilot Suggestion ---
async function acceptCopilotSuggestion() {
    await new Promise(resolve => setTimeout(resolve, PROMPT_DELAY_MS));
    try {
        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
        logInteraction('INFO', 'SUGGESTION_ACCEPTED', 'Accepted inline suggestion.');
        vscode.window.showInformationMessage('Accepted Copilot suggestion.');
    } catch (err) {
        const errorMsg = (err instanceof Error) ? err.message : String(err);
        logInteraction('ERROR', 'SUGGESTION_ACCEPT_FAILED', errorMsg);
        vscode.window.showErrorMessage(`Failed to accept suggestion: ${errorMsg}`);
    }
}

// --- Read Context for Agent Cooperation ---
async function getLastCopilotChatResponse(): Promise<string> {
    if (CONTEXT_SOURCE === 'chat') {
        // Placeholder for future Copilot chat API integration
        logInteraction('INFO', 'CONTEXT_SOURCE', 'Chat context not yet supported, falling back to editor.');
        vscode.window.showInformationMessage('Copilot chat context not supported, using editor context.');
        return 'Copilot chat response not available.';
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
    vscode.window.showWarningMessage('No active editor found for context.');
    return 'No active editor context available.';
}

// --- Main Agent Cooperation ---
async function agentCooperationMain(goal: string, historyProvider: HistoryProvider, context: vscode.ExtensionContext) {
    while (agentCooperationActive) {
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
            vscode.window.showErrorMessage('Failed to generate next prompt.');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// --- Automation File Discovery ---
function findAutomationFile(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined, userPath?: string): string | undefined {
    if (userPath && fs.existsSync(userPath) && userPath.endsWith('.json')) {
        try {
            const content = fs.readFileSync(userPath, 'utf-8');
            JSON.parse(content); // Validate JSON
            return userPath;
        } catch (err) {
            const errorMsg = (err instanceof Error) ? err.message : String(err);
            logInteraction('ERROR', 'INVALID_AUTOMATION_FILE', `Invalid JSON in ${userPath}: ${errorMsg}`);
            vscode.window.showErrorMessage(`Invalid automation file ${userPath}: ${errorMsg}`);
            return undefined;
        }
    }
    if (!workspaceFolders || workspaceFolders.length === 0) {
        logInteraction('WARNING', 'NO_WORKSPACE', 'No workspace folders found for automation file discovery.');
        vscode.window.showWarningMessage('No workspace open for automation file discovery.');
        return undefined;
    }
    const root = workspaceFolders[0].uri.fsPath;
    const candidates = glob.sync('{automation*.json,*.automation.json}', { cwd: root, absolute: true });
    for (const candidate of candidates) {
        try {
            const content = fs.readFileSync(candidate, 'utf-8');
            JSON.parse(content); // Validate JSON
            return candidate;
        } catch (err) {
            const errorMsg = (err instanceof Error) ? err.message : String(err);
            logInteraction('ERROR', 'INVALID_AUTOMATION_FILE', `Invalid JSON in ${candidate}: ${errorMsg}`);
            vscode.window.showErrorMessage(`Invalid automation file ${path.basename(candidate)}: ${errorMsg}`);
        }
    }
    logInteraction('INFO', 'NO_AUTOMATION_FILE', 'No valid automation file found.');
    vscode.window.showInformationMessage('No valid automation file found.');
    return undefined;
}

// --- Extension Activation ---
export function activate(context: vscode.ExtensionContext) {
    const historyProvider = new HistoryProvider();
    vscode.window.registerTreeDataProvider('copilotAutomatorHistory', historyProvider);

    const commandsJsonPath = context.asAbsolutePath('copilot-automator-commands.json');
    let commandsJson;
    try {
        const content = fs.readFileSync(commandsJsonPath, 'utf-8');
        commandsJson = JSON.parse(content);
    } catch (err) {
        const errorMsg = (err instanceof Error) ? err.message : String(err);
        logInteraction('ERROR', 'COMMANDS_JSON_INVALID', `Failed to load commands JSON: ${errorMsg}`);
        vscode.window.showErrorMessage(`Failed to load commands JSON: ${errorMsg}`);
        commandsJson = { commands: [] };
    }
    const commandsProvider = new CommandsProvider(commandsJson);
    vscode.window.registerTreeDataProvider('copilotAutomatorCommands', commandsProvider);
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.runCommand', (cmd: string) => {
            historyProvider.add(new HistoryItem(`Command: ${cmd}`, 'Clicked in Available Commands'));
            vscode.window.showInformationMessage(`Command triggered: ${cmd}`);
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
            postDialogue('Copilot Automator: Command received - ' + msg.value);
        }
    });

    const startCmd = vscode.commands.registerCommand('copilot-automator.start', async () => {
        if (agentCooperationActive) {
            vscode.window.showInformationMessage('Copilot Automator is already running.');
            return;
        }
        agentCooperationActive = true;
        promptCount = 0;
        const goal = await vscode.window.showInputBox({ prompt: 'What is your cooperation goal for Copilot?' });
        if (!goal) {
            vscode.window.showWarningMessage('No goal provided. Cooperation cancelled.');
            agentCooperationActive = false;
            return;
        }
        logInteraction('INFO', 'AGENT_COOPERATION_STARTED', goal);
        historyProvider.add(new HistoryItem('Cooperation started', goal));
        agentCooperationLoop = setTimeout(() => agentCooperationMain(goal, historyProvider, context), 0);
    });

    const stopCmd = vscode.commands.registerCommand('copilot-automator.stop', () => {
        agentCooperationActive = false;
        if (agentCooperationLoop) {
            clearTimeout(agentCooperationLoop);
            agentCooperationLoop = undefined;
        }
        logInteraction('INFO', 'AGENT_COOPERATION_STOPPED', 'Cooperation stopped by user.');
        historyProvider.add(new HistoryItem('Cooperation stopped', 'Stopped by user'));
        vscode.window.showInformationMessage('Copilot Automator stopped.');
    });

    const openSettingsCmd = vscode.commands.registerCommand('copilot-automator.openSettings', () => {
        openSettingsPanel(context);
    });

    const selectFilesCmd = vscode.commands.registerCommand('copilot-automator.selectFiles', async () => {
        const files = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: true,
            openLabel: 'Select Files for LLM Review'
        });
        if (files && files.length > 0) {
            selectedFiles = files.map(file => file.fsPath);
            const fileNames = selectedFiles.map(f => path.basename(f)).join(', ');
            logInteraction('INFO', 'FILES_SELECTED', `Selected files: ${fileNames}`);
            historyProvider.add(new HistoryItem('Files Selected', fileNames));
            vscode.window.showInformationMessage(`Selected ${selectedFiles.length} file(s) for LLM review.`);
        } else {
            logInteraction('INFO', 'FILES_SELECTION_CANCELLED', 'No files selected.');
            historyProvider.add(new HistoryItem('No Files Selected', 'File selection cancelled.'));
            vscode.window.showInformationMessage('No files selected for LLM review.');
        }
    });

    const manageSpecResourcesCmd = vscode.commands.registerCommand('copilot-automator.manageSpecResources', () => {
        openSpecResourcesPanel(context);
    });

    context.subscriptions.push(startCmd, stopCmd, openSettingsCmd, selectFilesCmd, manageSpecResourcesCmd);
}

export function deactivate() {
    agentCooperationActive = false;
    if (agentCooperationLoop) {
        clearTimeout(agentCooperationLoop);
        agentCooperationLoop = undefined;
    }
}