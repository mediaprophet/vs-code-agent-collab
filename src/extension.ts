import * as vscode from 'vscode';
import * as path from 'path';
import commandsJson from './copilot-automator-commands.json';
import {
    selectedFiles,
    LLM_API_URL as DEFAULT_LLM_API_URL,
    LLM_MODEL as DEFAULT_LLM_MODEL,
    LLM_TEMPERATURE as DEFAULT_LLM_TEMPERATURE,
    MAX_PROMPTS_PER_SESSION as DEFAULT_MAX_PROMPTS_PER_SESSION,
    LLM_ENDPOINTS,
    runAutomationFromInstructionFile,
    validateAllInstructionFiles,
    createTemplateInstructionFile,
    flexibleFileSelection,
    sendPromptToChat,
    acceptCopilotSuggestion,
    agentCooperationMain,
    // CommandsProvider
} from './components/commands';
import { CommandsProvider } from './components/commandsProvider';
import { HistoryProvider, logInteraction, LOG_LEVEL_INFO, LOG_LEVEL_ERROR } from './components/history';
import { HistoryItem } from './components/history';
import { LLMModelsProvider } from './components/llmModels';
import { AutomatorPanelProvider } from './components/panelProvider';
import { LocalChatPanelProvider } from './components/localChatPanelProvider';

// --- State ---
let logFilePath: string;
let agentCooperationActive = false;
let agentCooperationPaused = false;
let agentCooperationGoal: string | undefined = undefined;
let agentCooperationLoop: NodeJS.Timeout | undefined = undefined;

// --- Settings Panel ---
function openSettingsPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorSettings',
        'Copilot Automator Settings',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const settings = {
        llmApiUrl: context.globalState.get('llmApiUrl', DEFAULT_LLM_API_URL),
        llmModel: context.globalState.get('llmModel', DEFAULT_LLM_MODEL),
        llmTemp: context.globalState.get('llmTemp', DEFAULT_LLM_TEMPERATURE),
        maxPrompts: context.globalState.get('maxPrompts', DEFAULT_MAX_PROMPTS_PER_SESSION),
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
            vscode.window.showInformationMessage('Copilot Automator settings saved.');
            logInteraction(LOG_LEVEL_INFO, 'SETTINGS_SAVED', msg, logFilePath);
        } else if (msg.command === 'selectLlmEndpoint') {
            await context.globalState.update('llmApiUrl', msg.url);
            vscode.window.showInformationMessage(`Selected LLM endpoint: ${msg.url}`);
            logInteraction(LOG_LEVEL_INFO, 'LLM_ENDPOINT_SELECTED', msg.url, logFilePath);
        }
    });
}

function getSettingsHtml(settings: {
    llmApiUrl: string;
    llmModel: string;
    llmTemp: number;
    maxPrompts: number;
    contextSource: string;
    fileReviewPaths: string;
    specResourceUrls: string;
    llmEndpoints: { label: string; url: string }[];
}): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copilot Automator Settings</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans p-4">
    <h2 class="text-2xl font-bold mb-4 text-blue-700">Copilot Automator Settings</h2>
    <form onsubmit="event.preventDefault(); saveSettings();" class="space-y-4">
        <div>
            <label class="block font-semibold">LLM Endpoint</label>
            <select id="llmEndpoint" class="w-full border rounded px-2 py-1">
                ${settings.llmEndpoints.map(e => `<option value="${e.url}" ${e.url === settings.llmApiUrl ? 'selected' : ''}>${e.label}</option>`).join('')}
            </select>
            <button type="button" onclick="selectLlmEndpoint()" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded">Set Endpoint</button>
        </div>
        <div>
            <label class="block font-semibold">LLM API URL</label>
            <input type="text" id="llmApiUrl" value="${settings.llmApiUrl}" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold">Model</label>
            <input type="text" id="llmModel" value="${settings.llmModel}" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold">Temperature</label>
            <input type="number" id="llmTemp" value="${settings.llmTemp}" step="0.01" min="0" max="2" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold">Max Prompts/Session</label>
            <input type="number" id="maxPrompts" value="${settings.maxPrompts}" min="1" max="100" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold">Context Source</label>
            <select id="contextSource" class="w-full border rounded px-2 py-1">
                <option value="editor" ${settings.contextSource === 'editor' ? 'selected' : ''}>Active Editor</option>
                <option value="chat" ${settings.contextSource === 'chat' ? 'selected' : ''}>Copilot Chat (if available)</option>
            </select>
        </div>
        <div>
            <label class="block font-semibold">File Review Paths (e.g., src/*.ts)</label>
            <input type="text" id="fileReviewPaths" value="${settings.fileReviewPaths}" placeholder="Comma-separated paths or patterns" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold">Specification Resource URLs (comma-separated)</label>
            <input type="text" id="specResourceUrls" value="${settings.specResourceUrls}" placeholder="e.g., https://example.com/spec" class="w-full border rounded px-2 py-1" />
        </div>
        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save</button>
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
        function selectLlmEndpoint() {
            const url = document.getElementById('llmEndpoint').value;
            vscode.postMessage({ command: 'selectLlmEndpoint', url });
            document.getElementById('llmApiUrl').value = url;
        }
    </script>
</body>
</html>`;
}

// --- Log Viewer Panel ---
function openLogViewerPanel() {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorLogViewer',
        'Copilot Automator Logs',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    let logContent = '';
    try {
        logContent = require('fs').readFileSync(logFilePath, 'utf-8');
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logContent = `No log file found or failed to read log: ${errorMessage}`;
        logInteraction(LOG_LEVEL_ERROR, 'LOG_READ_FAILED', errorMessage, logFilePath);
    }
    panel.webview.html = getLogViewerHtml(logContent);
    panel.webview.onDidReceiveMessage((msg: any) => {
        if (msg.command === 'filterLogs') {
            let filtered = '';
            try {
                const lines = logContent.split('\n').filter(Boolean);
                filtered = lines
                    .filter(line => {
                        try {
                            const entry = JSON.parse(line);
                            return msg.level === 'ALL' || entry.logLevel === msg.level;
                        } catch {
                            return false;
                        }
                    })
                    .join('\n');
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                filtered = `Error filtering logs: ${errorMessage}`;
                logInteraction(LOG_LEVEL_ERROR, 'LOG_FILTER_FAILED', errorMessage, logFilePath);
            }
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
            vscode.window.showInformationMessage('Specification resource URLs saved.');
            logInteraction(LOG_LEVEL_INFO, 'SPEC_URLS_SAVED', newUrls, logFilePath);
        }
    });
}

function getSpecResourcesHtml(urls: string[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Specification Resources</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans p-4">
    <h2 class="text-2xl font-bold mb-4 text-blue-700">Specification Resources</h2>
    <ul id="urlList" class="space-y-2">
        ${urls.map((url, index) => `
            <li class="flex items-center">
                <input type="text" value="${url}" data-index="${index}" class="flex-1 border rounded px-2 py-1 mr-2" />
                <button onclick="removeUrl(${index})" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Remove</button>
            </li>
        `).join('')}
    </ul>
    <button id="addUrl" class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Add URL</button>
    <button onclick="saveUrls()" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save</button>
    <script>
        const vscode = acquireVsCodeApi();
        const urlList = document.getElementById('urlList');
        document.getElementById('addUrl').onclick = () => {
            const li = document.createElement('li');
            li.className = 'flex items-center';
            li.innerHTML = '<input type="text" placeholder="Enter URL" data-index="' + urlList.children.length + '" class="flex-1 border rounded px-2 py-1 mr-2" /><button onclick="removeUrl(' + urlList.children.length + ')" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Remove</button>';
            urlList.appendChild(li);
        };
        function removeUrl(index) {
            const li = urlList.querySelector('[data-index="' + index + '"]').parentElement;
            urlList.removeChild(li);
            Array.from(urlList.children).forEach((child, i) => {
                child.querySelector('input').setAttribute('data-index', i);
                child.querySelector('button').setAttribute('onclick', 'removeUrl(' + i + ')');
            });
        }
        function saveUrls() {
            const urls = Array.from(urlList.querySelectorAll('input')).map(input => input.value.trim()).filter(url => url);
            vscode.postMessage({ command: 'saveSpecUrls', urls });
        }
    <\/script>
</body>
</html>`;
}

export function activate(context: vscode.ExtensionContext) {
    // Restore session state
    agentCooperationPaused = context.globalState.get('agentCooperationPaused', false);
    agentCooperationGoal = context.globalState.get('agentCooperationGoal', undefined);
    logFilePath = path.join(context.extensionPath, 'copilot_interactions.log');

    const historyProvider = new HistoryProvider();
    vscode.window.registerTreeDataProvider('copilotAutomatorHistory', historyProvider);

    const commandsProvider = new CommandsProvider(commandsJson);
    vscode.window.registerTreeDataProvider('copilotAutomatorCommands', commandsProvider);

    const modelsProvider = new LLMModelsProvider(context);
    vscode.window.registerTreeDataProvider('copilotAutomatorModels', modelsProvider);

    const provider = new AutomatorPanelProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(AutomatorPanelProvider.viewType, provider));

    // Register Local Chat Panel
    const localChatProvider = new LocalChatPanelProvider();
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(LocalChatPanelProvider.viewType, localChatProvider));

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.openLocalChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.copilotAutomatorActivityBar');
            vscode.commands.executeCommand('workbench.views.service.openView', LocalChatPanelProvider.viewType);
        }),
        vscode.commands.registerCommand('copilot-automator.runCommand', async (cmd: string) => {
            historyProvider.add(new HistoryItem(`Command: ${cmd}`, 'Clicked in Available Commands'));
            switch (cmd) {
                case 'start':
                    await vscode.commands.executeCommand('copilot-automator.start');
                    break;
                case 'pause':
                    await vscode.commands.executeCommand('copilot-automator.pause');
                    break;
                case 'resume':
                    await vscode.commands.executeCommand('copilot-automator.resume');
                    break;
                case 'stop':
                    await vscode.commands.executeCommand('copilot-automator.stop');
                    break;
                case 'openSettings':
                    await vscode.commands.executeCommand('copilot-automator.openSettings');
                    break;
                case 'sendPrompt':
                    const prompt = await vscode.window.showInputBox({ prompt: 'Enter prompt to send to Copilot Chat:' });
                    if (prompt) await sendPromptToChat(prompt, historyProvider);
                    break;
                case 'acceptSuggestion':
                    await acceptCopilotSuggestion();
                    break;
                case 'logInteraction':
                    const logMsg = await vscode.window.showInputBox({ prompt: 'Enter log message:' });
                    if (logMsg) {
                        logInteraction(LOG_LEVEL_INFO, 'USER_LOG', logMsg, logFilePath);
                        vscode.window.showInformationMessage('Log entry added.');
                    }
                    break;
                default:
                    vscode.window.showWarningMessage(`No action implemented for command: ${cmd}`);
            }
        }),
        vscode.commands.registerCommand('copilot-automator.start', async () => {
            if (agentCooperationActive) {
                vscode.window.showInformationMessage('Copilot Automator is already running.');
                return;
            }
            agentCooperationActive = true;
            agentCooperationPaused = false;
            const goal = await vscode.window.showInputBox({ prompt: 'What is your cooperation goal for Copilot?' });
            if (!goal) {
                vscode.window.showWarningMessage('No goal provided. Cooperation cancelled.');
                agentCooperationActive = false;
                return;
            }
            agentCooperationGoal = goal;
            await context.globalState.update('agentCooperationGoal', goal);
            await context.globalState.update('agentCooperationPaused', false);
            logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_STARTED', goal, logFilePath);
            historyProvider.add(new HistoryItem('Cooperation started', goal));
            if (agentCooperationGoal) {
                agentCooperationLoop = setTimeout(() => agentCooperationMain(agentCooperationGoal as string, historyProvider), 0);
            }
        }),
        vscode.commands.registerCommand('copilot-automator.pause', async () => {
            if (agentCooperationActive && !agentCooperationPaused) {
                agentCooperationPaused = true;
                await context.globalState.update('agentCooperationPaused', true);
                vscode.window.showInformationMessage('Copilot Automator paused.');
                logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_PAUSED', 'Paused by user.', logFilePath);
                historyProvider.add(new HistoryItem('Cooperation paused', 'Paused by user'));
            }
        }),
        vscode.commands.registerCommand('copilot-automator.resume', async () => {
            if (agentCooperationActive && agentCooperationPaused) {
                agentCooperationPaused = false;
                await context.globalState.update('agentCooperationPaused', false);
                vscode.window.showInformationMessage('Copilot Automator resumed.');
                logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_RESUMED', 'Resumed by user.', logFilePath);
                historyProvider.add(new HistoryItem('Cooperation resumed', 'Resumed by user'));
                if (agentCooperationGoal) {
                    agentCooperationLoop = setTimeout(() => agentCooperationMain(agentCooperationGoal as string, historyProvider), 0);
                }
            }
        }),
        vscode.commands.registerCommand('copilot-automator.stop', () => {
            agentCooperationActive = false;
            agentCooperationPaused = false;
            agentCooperationGoal = undefined;
            context.globalState.update('agentCooperationPaused', false);
            context.globalState.update('agentCooperationGoal', undefined);
            if (agentCooperationLoop) {
                clearTimeout(agentCooperationLoop);
                agentCooperationLoop = undefined;
            }
            logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_STOPPED', 'Cooperation stopped by user.', logFilePath);
            historyProvider.add(new HistoryItem('Cooperation stopped', 'Stopped by user'));
            vscode.window.showInformationMessage('Copilot Automator stopped.');
        }),
        vscode.commands.registerCommand('copilot-automator.openSettings', () => {
            openSettingsPanel(context);
        }),
        vscode.commands.registerCommand('copilot-automator.selectFiles', async () => {
            await flexibleFileSelection();
            if (selectedFiles.length > 0) {
                const fileNames = selectedFiles.map(f => path.basename(f)).join(', ');
                historyProvider.add(new HistoryItem('Files Selected', fileNames));
            } else {
                historyProvider.add(new HistoryItem('No Files Selected', 'File selection cancelled.'));
            }
        }),
        vscode.commands.registerCommand('copilot-automator.manageSpecResources', () => {
            openSpecResourcesPanel(context);
        }),
        vscode.commands.registerCommand('copilot-automator.createTemplateInstruction', () => {
            createTemplateInstructionFile();
        }),
        vscode.commands.registerCommand('copilot-automator.validateInstructions', () => {
            validateAllInstructionFiles();
        }),
        vscode.commands.registerCommand('copilot-automator.runInstructionFile', () => {
            runAutomationFromInstructionFile(historyProvider);
        }),
        vscode.commands.registerCommand('copilot-automator.openLogViewer', () => {
            openLogViewerPanel();
        }),
        vscode.commands.registerCommand('copilot-automator.refreshModels', () => modelsProvider.refresh()),
        vscode.commands.registerCommand('copilot-automator.selectModel', async (model: string) => {
            await modelsProvider.selectModel(model);
        })
    );

    modelsProvider.refresh();
}

export function deactivate() {
    agentCooperationActive = false;
    agentCooperationPaused = false;
    if (agentCooperationLoop) {
        clearTimeout(agentCooperationLoop);
        agentCooperationLoop = undefined;
    }
}