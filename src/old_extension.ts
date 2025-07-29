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
        // Show control buttons at the top, then history
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
    /**
     * Selects an LLM model, updates global state, and refreshes the tree view.
     */
    async selectModel(model: string) {
        this.selectedModel = model;
        await this.context.globalState.update('llmModel', model);
        LLM_MODEL = model;
        this._onDidChangeTreeData.fire();
        vscode.window.showInformationMessage(`Selected LLM model: ${model}`);
    }
    private _onDidChangeTreeData: vscode.EventEmitter<LLMModelItem | undefined | void> = new vscode.EventEmitter<LLMModelItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<LLMModelItem | undefined | void> = this._onDidChangeTreeData.event;
    private models: string[] = [];
    private selectedModel: string | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.selectedModel = context.globalState.get('llmModel', LLM_MODEL);
    }

    async refresh() {
        try {
            const apiUrl = this.context.globalState.get('llmApiUrl', LLM_API_URL).replace(/\/v1\/chat\/completions$/, '/v1/models');
            const response = await axios.get(apiUrl);
            this.models = response.data.data?.map((m: any) => m.id) || [];
        } catch (e) {
            this.models = [];
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
function openSettingsPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorSettings',
        'Copilot Automator Settings',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    // Load settings from globalState or defaults
    const settings = {
        llmApiUrl: context.globalState.get('llmApiUrl', LLM_API_URL),
        llmModel: context.globalState.get('llmModel', LLM_MODEL),
        llmTemp: context.globalState.get('llmTemp', LLM_TEMPERATURE),
        maxPrompts: context.globalState.get('maxPrompts', MAX_PROMPTS_PER_SESSION)
    };
    panel.webview.html = getSettingsHtml(settings);
    panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === 'saveSettings') {
            await context.globalState.update('llmApiUrl', msg.llmApiUrl);
            await context.globalState.update('llmModel', msg.llmModel);
            await context.globalState.update('llmTemp', msg.llmTemp);
            await context.globalState.update('maxPrompts', msg.maxPrompts);
            // Update in-memory values
            LLM_API_URL = msg.llmApiUrl;
            LLM_MODEL = msg.llmModel;
            LLM_TEMPERATURE = msg.llmTemp;
            MAX_PROMPTS_PER_SESSION = msg.maxPrompts;
            vscode.window.showInformationMessage('Copilot Automator settings saved.');
        }
    });
}

function getSettingsHtml(settings: { llmApiUrl: string, llmModel: string, llmTemp: number, maxPrompts: number }): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Copilot Automator Settings</title>
        </head>
        <body>
            <h2>Copilot Automator Settings</h2>
            <form onsubmit="event.preventDefault(); saveSettings();">
                <label>LLM API URL: <input type="text" id="llmApiUrl" value="${settings.llmApiUrl}" /></label><br/>
                <label>Model: <input type="text" id="llmModel" value="${settings.llmModel}" /></label><br/>
                <label>Temperature: <input type="number" id="llmTemp" value="${settings.llmTemp}" step="0.01" min="0" max="2" /></label><br/>
                <label>Max Prompts/Session: <input type="number" id="maxPrompts" value="${settings.maxPrompts}" min="1" max="100" /></label><br/>
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
                        maxPrompts: parseInt(document.getElementById('maxPrompts').value, 10)
                    });
                }
            </script>
        </body>
        </html>
    `;
}import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// --- Activity Bar View Provider ---
class AutomatorPanelProvider implements vscode.WebviewViewProvider {
    dispose() {
        // No resources to clean up
    }
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
        // Enhanced UI: Go/Stop buttons, dialogue display, command input
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
        button { margin-right: 0.5em; }
    </style>
</head>
<body>
    <h2>Copilot Automator</h2>
    <div id="controls">
        <button id="goBtn">Go</button>
        <button id="stopBtn">Stop</button>
        <button id="settingsBtn">Settings</button>
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
}

// --- Settings Panel (Webview) ---

// --- Configurable constants (persistent) ---
let MAX_PROMPTS_PER_SESSION = 10;
let LLM_API_URL = 'http://localhost:1234/v1/chat/completions';
let LLM_MODEL = 'your-model-name'; // Update as needed
let LLM_TEMPERATURE = 0.7;
const PROMPT_DELAY_MS = 2000;

// --- State ---
let promptCount = 0;
let automationActive = false;
let automationLoop: NodeJS.Timeout | undefined;
let logFilePath: string;

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
        }
    });
}

// --- LLM Integration ---
async function generatePromptFromLocalLLM(contextualInfo: string): Promise<string> {
    try {
        const payload = {
            model: LLM_MODEL,
            messages: [
                { role: 'system', content: 'You are an expert coding assistant.' },
                { role: 'user', content: contextualInfo }
            ],
            temperature: LLM_TEMPERATURE
        };
        const response = await axios.post(LLM_API_URL, payload);
        const content = response.data.choices?.[0]?.message?.content || '';
        logInteraction('INFO', 'LOCAL_LLM_REQUEST', { request: payload, response: content });
        return content;
    } catch (error) {
        logInteraction('ERROR', 'LOCAL_LLM_REQUEST', error);
        return '';
    }
}

// --- Copilot Chat Automation ---
async function sendPromptToChat(promptText: string) {
    if (promptCount >= MAX_PROMPTS_PER_SESSION) {
        // Try to close and reopen chat to reset context
        await vscode.commands.executeCommand('workbench.action.closePanel');
        promptCount = 0;
        logInteraction('INFO', 'CHAT_SESSION_RESET', 'Session reset after max prompts.');
    }
    await vscode.commands.executeCommand('workbench.action.chat.open', promptText);
    promptCount++;
    logInteraction('INFO', 'PROMPT_SENT', promptText);
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

// --- Read Copilot Chat Response (placeholder) ---
async function getLastCopilotChatResponse(): Promise<string> {
    // TODO: Implement using VS Code API or UI observation if/when available
    // For now, return a placeholder
    return 'Copilot response placeholder.';
}

// --- Main Automation Loop ---
async function automationMainLoop(goal: string) {
    while (automationActive) {
        // 1. Read Copilot's last response
        const lastResponse = await getLastCopilotChatResponse();
        // 2. Generate next prompt using local LLM
        const nextPrompt = await generatePromptFromLocalLLM(
            `Given this response from my coding assistant: "${lastResponse}", what should my next question be to achieve: ${goal}?`
        );
        // 3. Send prompt to Copilot Chat
        await sendPromptToChat(nextPrompt);
        // 4. Optionally accept Copilot suggestion
        await acceptCopilotSuggestion();
        // 5. Wait or break if stopped
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// --- Extension Activation ---
// --- Automation File Discovery ---
import * as glob from 'glob';

/**
 * Looks for an automation JSON file in the workspace root or a user-specified location.
 * @param workspaceFolders VS Code workspace folders
 * @param userPath Optional user-specified path
 * @returns The absolute path to the automation file, or undefined if not found
 */
function findAutomationFile(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined, userPath?: string): string | undefined {
    if (userPath && fs.existsSync(userPath) && userPath.endsWith('.json')) {
        return userPath;
    }
    if (!workspaceFolders || workspaceFolders.length === 0) return undefined;
    const root = workspaceFolders[0].uri.fsPath;
    // Look for automation*.json or *.automation.json in root
    const candidates = glob.sync('{automation*.json,*.automation.json}', { cwd: root, absolute: true });
    return candidates.length > 0 ? candidates[0] : undefined;
}

export function activate(context: vscode.ExtensionContext) {
    // --- Automation History/Logs Tree View ---
    const historyProvider = new HistoryProvider();
    vscode.window.registerTreeDataProvider('copilotAutomatorHistory', historyProvider);
    // --- Available Commands Tree View ---
    const commandsJson = require(context.asAbsolutePath('copilot-automator-commands.json'));
    const commandsProvider = new CommandsProvider(commandsJson);
    vscode.window.registerTreeDataProvider('copilotAutomatorCommands', commandsProvider);
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.runCommand', (cmd: string) => {
            // For demo: just log and show
            historyProvider.add(new HistoryItem(`Command: ${cmd}`, 'Clicked in Available Commands'));
            vscode.window.showInformationMessage(`Command triggered: ${cmd}`);
        })
    );
    // Register LLM Models Tree View
    const modelsProvider = new LLMModelsProvider(context);
    vscode.window.registerTreeDataProvider('copilotAutomatorModels', modelsProvider);
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.refreshModels', () => modelsProvider.refresh()),
        vscode.commands.registerCommand('copilot-automator.selectModel', async (model: string) => {
            await modelsProvider.selectModel(model);
        })
    );
    // Initial fetch
    modelsProvider.refresh();
    // Helper to send dialogue to the panel
    function postDialogue(text: string) {
        for (const sub of context.subscriptions) {
            if (sub instanceof AutomatorPanelProvider && sub['_view']) {
                sub['_view'].webview.postMessage({ type: 'dialogue', text });
            }
        }
        // Also log to history
        if (historyProvider) {
            historyProvider.add(new HistoryItem(text, 'Dialogue'));
        }
    }
    logFilePath = path.join(context.extensionPath, 'copilot_interactions.log');

    // Load settings from globalState
    LLM_API_URL = context.globalState.get('llmApiUrl', LLM_API_URL);
    LLM_MODEL = context.globalState.get('llmModel', LLM_MODEL);
    LLM_TEMPERATURE = context.globalState.get('llmTemp', LLM_TEMPERATURE);
    MAX_PROMPTS_PER_SESSION = context.globalState.get('maxPrompts', MAX_PROMPTS_PER_SESSION);

    // Register Activity Bar view provider
    const provider = new AutomatorPanelProvider(context.extensionUri);
    context.subscriptions.push(provider);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            AutomatorPanelProvider.viewType,
            provider
        )
    );
    // Listen for messages from the webview panel
    vscode.window.registerWebviewViewProvider(AutomatorPanelProvider.viewType, provider);
    provider['_view']?.webview.onDidReceiveMessage?.((msg: any) => {
        if (msg.command === 'start') {
            vscode.commands.executeCommand('copilot-automator.start');
        } else if (msg.command === 'stop') {
            vscode.commands.executeCommand('copilot-automator.stop');
        } else if (msg.command === 'openSettings') {
            vscode.commands.executeCommand('copilot-automator.openSettings');
        } else if (msg.command === 'sendCommand') {
            // For demo: just echo the command
            postDialogue('Copilot Automator: Command received - ' + msg.value);
        }
    });

    // Register commands
    const startCmd = vscode.commands.registerCommand('copilot-automator.start', async () => {
        if (automationActive) {
            vscode.window.showInformationMessage('Copilot Automator is already running.');
            return;
        }
        automationActive = true;
        promptCount = 0;
        const goal = await vscode.window.showInputBox({ prompt: 'What is your automation goal for Copilot?' });
        if (!goal) {
            vscode.window.showWarningMessage('No goal provided. Automation cancelled.');
            automationActive = false;
            return;
        }
        logInteraction('INFO', 'AUTOMATION_STARTED', goal);
        historyProvider.add(new HistoryItem('Automation started', goal));
        automationLoop = setTimeout(() => automationMainLoop(goal), 0);
    });

    const stopCmd = vscode.commands.registerCommand('copilot-automator.stop', () => {
        automationActive = false;
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

    context.subscriptions.push(startCmd, stopCmd, openSettingsCmd);
}

export function deactivate() {
    automationActive = false;
    if (automationLoop) {
        clearTimeout(automationLoop);
        automationLoop = undefined;
    }
}
