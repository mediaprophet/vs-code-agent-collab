import { openMindMapOntologyPanel } from './modules/mindmapPanel';
import { OntologiesTreeProvider } from './components/OntologiesTreeProvider';
// removed duplicate imports for path and fs
import { openSemWebPanel } from './modules/semwebPanel';
    // Register Semantic Web Tools panel command
    // (Removed duplicate registration; command is registered in activate())
import { createAutomatorFolder, createAutomatorSettingsFile } from './tools/automatorFolder';
import { buildLLMContextFile, handleLLMProjectConfig, presentConfigToUser } from './tools/agentProjectSetup';
function openAutomatorFolderPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorFolder',
        'Automator Folder Setup',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'ui', 'automatorFolder.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'quickCreateAutomator') {
            const created = await createAutomatorFolder();
            let html = created ? '<p>.automator folder created successfully.</p>' : '<p>Failed to create .automator folder.</p>';
            if (created) await createAutomatorSettingsFile();
            panel.webview.postMessage({ command: 'showResult', html });
        } else if (msg.command === 'formCreateAutomator') {
            const created = await createAutomatorFolder();
            let html = created ? '<p>.automator folder created.</p>' : '<p>Failed to create .automator folder.</p>';
            if (created) {
                const settings = {
                    projectType: msg.projectType,
                    name: msg.name,
                    description: msg.description
                };
                await createAutomatorSettingsFile(settings);
                html += '<p>Settings file created.</p>';
            }
            panel.webview.postMessage({ command: 'showResult', html });
        } else if (msg.command === 'agentCreateAutomator') {
            // Simulate LLM call: in real use, call LLM API with context
            const contextText = buildLLMContextFile(msg.description);
            // For demo, just echo back as JSON
            let llmResponse = JSON.stringify({
                projectType: 'agent-generated',
                name: 'LLM Project',
                description: msg.description,
                resources: []
            });
            // In real use, replace above with LLM API call
            const config = await handleLLMProjectConfig(llmResponse);
            const html = presentConfigToUser(config);
            panel.webview.postMessage({ command: 'showResult', html });
        }
    });
}
// (moved command registration into activate)
// ...existing code...
// (removed duplicate activate)
import { getMappings, addMapping, removeMapping } from './tools/mapping';
// removed duplicate import for chatparticipants

// --- Webview Panel Functions ---
import { openMappingPanel } from './modules/mappingPanel';

import { openChatParticipantsPanel } from './modules/chatParticipantsPanel';
// removed duplicate imports
import { getParticipants, addParticipant, removeParticipant } from './tools/chatparticipants';

// removed duplicate function openChatParticipantsPanel
import * as vscode from 'vscode';
import * as path from 'path';
import commandsJson from './copilot-automator-commands.json';
import { LLM_API_URL as DEFAULT_LLM_API_URL, LLM_MODEL as DEFAULT_LLM_MODEL, LLM_TEMPERATURE as DEFAULT_LLM_TEMPERATURE, LLM_ENDPOINTS, sendPromptToChat } from './components/llmHelpers';
import { validateInstructionFiles, acceptCopilotSuggestion } from './components/automation';
import { AgentCooperationState } from './components/state';

import * as fs from 'fs';
const tasksFilePath = path.join(__dirname, '..', 'agent_tasks.json');

type AgentTask = { description: string; status: string };
type AgentTasksData = { goal: string; tasks: AgentTask[]; completed: AgentTask[] };

function agentCooperationMain(goal: string, historyProvider: any) {
    // Load or initialize tasks
    let tasksData: AgentTasksData = { goal: '', tasks: [], completed: [] };
    if (fs.existsSync(tasksFilePath)) {
        try {
            tasksData = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
        } catch (e) {
            vscode.window.showWarningMessage('Could not read agent_tasks.json, starting fresh.');
        }
    }
    // If new goal, reset tasks
    if (tasksData.goal !== goal) {
        tasksData.goal = goal;
        tasksData.tasks = [
            { description: `Break down the goal: ${goal}`, status: 'pending' },
            { description: `Plan steps for: ${goal}`, status: 'pending' },
            { description: `Execute first step for: ${goal}`, status: 'pending' }
        ];
        tasksData.completed = [];
    }

    vscode.window.showInformationMessage(`Agent cooperation started with goal: ${goal}`);
    if (historyProvider && typeof historyProvider.add === 'function') {
        historyProvider.add(new HistoryItem('Agent Start', `Goal: ${goal}`));
    }

    // Process each pending task (simulate for now)
    for (const task of tasksData.tasks) {
        if (task.status === 'pending') {
            // Simulate doing the task
            vscode.window.showInformationMessage(`Agent working: ${task.description}`);
            if (historyProvider && typeof historyProvider.add === 'function') {
                historyProvider.add(new HistoryItem('Agent Task', task.description));
            }
            task.status = 'done';
            tasksData.completed.push(task);
        }
    }
    // Remove completed from tasks
    tasksData.tasks = tasksData.tasks.filter(t => t.status !== 'done');

    // Save updated tasks
    try {
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasksData, null, 2), 'utf8');
    } catch (e) {
        vscode.window.showWarningMessage('Could not write agent_tasks.json');
    }

    // Final log
    if (historyProvider && typeof historyProvider.add === 'function') {
        historyProvider.add(new HistoryItem('Agent Complete', `All tasks for goal: ${goal} processed.`));
    }
}

// Provide stubs for missing imports to avoid runtime errors
export function mapUITextArea(_context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('mapUITextArea is not implemented.');
}
export function loadUITextAreaMappings(_context: vscode.ExtensionContext) {
    // No-op stub
}

// Removed fallback stub for flexibleFileSelection; direct import is always used.
// Stubs for any other referenced but missing features
function openSpecResourcesPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorSpecResources',
        'Manage Specification Resources',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'ui', 'manageSpecResources.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');
    // Load initial spec resources from global state
    panel.webview.postMessage({
        specResourceUrls: context.globalState.get('specResourceUrls', '')
    });
    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'saveSpecResources') {
            await context.globalState.update('specResourceUrls', msg.specResourceUrls);
            panel.webview.postMessage({ command: 'specResourcesSaved' });
        }
    });
}
function openLogViewerPanel() {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorLogViewer',
        'Copilot Automator Log Viewer',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'ui', 'logViewer.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');
    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'getLogs') {
            const logPath = path.join(vscode.workspace.rootPath || __dirname, 'copilot_interactions.log');
            let logs = '';
            if (fs.existsSync(logPath)) {
                logs = fs.readFileSync(logPath, 'utf8');
            }
            panel.webview.postMessage({ command: 'logsData', logs });
        }
    });
}
function openCreateTemplateInstructionsPanel(_context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorCreateTemplateInstructions',
        'Create Template Instruction',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'ui', 'createTemplateInstructions.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');
    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'createTemplateInstruction') {
            try {
                const { createTemplateInstructions } = require('./tools/createTemplateInstructions');
                const filePath = createTemplateInstructions(msg.targetDir, msg.fileName);
                panel.webview.postMessage({ command: 'templateCreated', filePath });
            } catch (error) {
                panel.webview.postMessage({ command: 'templateError', error: (error && (error as any).message) ? (error as any).message : String(error) });
            }
        }
    });
}
function getSettingsHtml(settings: any): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copilot Automator Settings</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans p-6">
    <h2 class="text-2xl font-bold text-blue-700 mb-4">Copilot Automator Settings</h2>
    <form id="settingsForm" class="space-y-4 max-w-xl">
        <div>
            <label class="block font-semibold mb-1" for="llmApiUrl">LLM API URL</label>
            <input type="text" id="llmApiUrl" name="llmApiUrl" value="${settings.llmApiUrl || ''}" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold mb-1" for="llmModel">LLM Model</label>
            <input type="text" id="llmModel" name="llmModel" value="${settings.llmModel || ''}" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold mb-1" for="llmTemp">LLM Temperature</label>
            <input type="number" step="0.01" min="0" max="2" id="llmTemp" name="llmTemp" value="${settings.llmTemp || 0.7}" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold mb-1" for="maxPrompts">Max Prompts per Session</label>
            <input type="number" min="1" id="maxPrompts" name="maxPrompts" value="${settings.maxPrompts || 10}" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
            <label class="block font-semibold mb-1" for="contextSource">Context Source</label>
            <select id="contextSource" name="contextSource" class="w-full border rounded px-2 py-1">
                <option value="editor" ${settings.contextSource === 'editor' ? 'selected' : ''}>Editor</option>
                <option value="files" ${settings.contextSource === 'files' ? 'selected' : ''}>Files</option>
                <option value="both" ${settings.contextSource === 'both' ? 'selected' : ''}>Both</option>
            </select>
        </div>
        <div>
            <label class="block font-semibold mb-1" for="fileReviewPaths">File Review Paths</label>
            <input type="text" id="fileReviewPaths" name="fileReviewPaths" value="${settings.fileReviewPaths || ''}" class="w-full border rounded px-2 py-1" placeholder="e.g. src/,lib/" />
        </div>
        <div>
            <label class="block font-semibold mb-1" for="specResourceUrls">Specification Resource URLs</label>
            <textarea id="specResourceUrls" name="specResourceUrls" class="w-full border rounded px-2 py-1" rows="2" placeholder="One URL per line">${settings.specResourceUrls || ''}</textarea>
        </div>
        <div class="flex gap-4 mt-6">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold">Save Settings</button>
        </div>
    </form>
    <div id="saveStatus" class="mt-4 text-green-700 font-semibold"></div>
    <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('settingsForm').onsubmit = function(e) {
            e.preventDefault();
            const form = e.target;
            vscode.postMessage({
                command: 'saveSettings',
                llmApiUrl: form.llmApiUrl.value,
                llmModel: form.llmModel.value,
                llmTemp: parseFloat(form.llmTemp.value),
                maxPrompts: parseInt(form.maxPrompts.value, 10),
                contextSource: form.contextSource.value,
                fileReviewPaths: form.fileReviewPaths.value,
                specResourceUrls: form.specResourceUrls.value
            });
            document.getElementById('saveStatus').textContent = 'Saving...';
        };
        window.addEventListener('message', event => {
            if (event.data && event.data.command === 'settingsSaved') {
                document.getElementById('saveStatus').textContent = 'Settings saved!';
            }
        });
    </script>
</body>
</html>`;
}
import { CommandsProvider } from './components/commandsProvider';
import { HistoryProvider, logInteraction, LOG_LEVEL_INFO, HistoryItem } from './components/history';
import { LLMModelsProvider } from './components/llmModels';
import { AutomatorPanelProvider } from './components/panelProvider';
import { AutomatorPanelBridge } from './components/automatorPanelBridge';
import { LocalChatPanelProvider } from './components/localChatPanelProvider';
// Helper to send output to Automator panel dialogue log
function sendToAutomatorPanel(text: string) {
    AutomatorPanelBridge.getInstance().sendDialogue(text);
}

import { registerAutomatorChatParticipant } from './components/automatorChatParticipant';

import { flexibleFileSelection } from './components/flexibleFileSelection';
import { executeFirstInstructionFile as runAutomationFromInstructionFile } from './components/automation';
import { setAgentCooperationGoal, getAgentCooperationGoal, clearAgentCooperationGoal } from './components/agentCooperationGoal';




// --- State ---
let logFilePath: string;
let agentCooperationActive = false;
let agentCooperationPaused = false;

let agentCooperationLoop: NodeJS.Timeout | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
    // --- Plugin Loader ---
    try {
        const { loadPlugins } = require('./automator/pluginLoader');
        // Provide a minimal extension API for plugins (expand as needed)
        const extensionApi = {
            vscode,
            context,
            registerPanel: (id: string, panelDef: any) => {
                // Example: register a new webview panel
                // (Implement as needed for plugin panels)
                // For now, just log registration
                console.log(`[PluginAPI] Panel registered: ${id}`);
            },
            // Add more API methods as needed
        };
        loadPlugins(extensionApi);
    } catch (e) {
        console.warn('[PluginLoader] Failed to load plugins:', e);
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.openMindMapOntology', () => {
            openMindMapOntologyPanel();
        })
    );
    // Enable ontology tree view if ontology features are enabled
    const ontologyFeaturesEnabled = true; // TODO: Make configurable
    if (ontologyFeaturesEnabled) {
        const ontologiesProvider = new OntologiesTreeProvider();
        vscode.window.registerTreeDataProvider('copilotAutomatorOntologies', ontologiesProvider);
    }
    // Register mapping, chat participants, and semantic web panel commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.openMappingPanel', () => {
            openMappingPanel(context);
        }),
        vscode.commands.registerCommand('copilot-automator.openChatParticipants', () => {
            openChatParticipantsPanel(context);
        }),
        vscode.commands.registerCommand('copilot-automator.openSemWebPanel', () => {
            openSemWebPanel();
        })
    );
    // Restore session state
    agentCooperationPaused = context.globalState.get('agentCooperationPaused', false);
    // Use persistent JSON-backed goal if available
    // Restore goal from persistent storage if needed (no local variable required)
    getAgentCooperationGoal(context);
    logFilePath = path.join(context.extensionPath, 'copilot_interactions.log');

    // Register Copilot Automator chat participant and export output to Automator panel
    registerAutomatorChatParticipant(context, (output: string) => {
        sendToAutomatorPanel(output);
    });
    loadUITextAreaMappings(context);

    const historyProvider = new HistoryProvider();
    vscode.window.registerTreeDataProvider('copilotAutomatorHistory', historyProvider);

    const commandsProvider = new CommandsProvider(commandsJson);
    vscode.window.registerTreeDataProvider('copilotAutomatorCommands', commandsProvider);

    const modelsProvider = new LLMModelsProvider(context);
    vscode.window.registerTreeDataProvider('copilotAutomatorModels', modelsProvider);

    const provider = new AutomatorPanelProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(AutomatorPanelProvider.viewType, provider));

    // Register Local Chat Panel
    const localChatPanelProviderInstance = new LocalChatPanelProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(LocalChatPanelProvider.viewType, localChatPanelProviderInstance));

    // Command to refresh the local chat panel (for model changes)
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.refreshLocalChatPanel', () => {
            localChatPanelProviderInstance.refreshHtml();
        })
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-automator.mapUITextArea', () => {
            mapUITextArea(context);
            historyProvider.add(new HistoryItem('Mapped UI Text Area', 'User mapped a text area'));
            sendToAutomatorPanel('System: UI Text Area mapped.');
        }),
        vscode.commands.registerCommand('copilot-automator.openLocalChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.copilotAutomatorActivityBar');
            vscode.commands.executeCommand('workbench.views.service.openView', LocalChatPanelProvider.viewType);
        }),
        vscode.commands.registerCommand('copilot-automator.runCommand', async (cmd: string) => {
            historyProvider.add(new HistoryItem(`Command: ${cmd}`, 'Clicked in Available Commands'));
            sendToAutomatorPanel('User: ' + cmd);
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
                    if (prompt) {
                        await sendPromptToChat(prompt);
                        sendToAutomatorPanel('User: ' + prompt);
                    }
                    break;
                case 'acceptSuggestion':
                    await acceptCopilotSuggestion();
                    break;
                case 'logInteraction':
                    const logMsg = await vscode.window.showInputBox({ prompt: 'Enter log message:' });
                    if (logMsg) {
                        logInteraction(LOG_LEVEL_INFO, 'USER_LOG', logMsg, logFilePath);
                        vscode.window.showInformationMessage('Log entry added.');
                        sendToAutomatorPanel('System: Log entry added.');
                    }
                    break;
                default:
                    vscode.window.showWarningMessage(`No action implemented for command: ${cmd}`);
                    sendToAutomatorPanel('System: No action implemented for command: ' + cmd);
            }
        }),
        vscode.commands.registerCommand('copilot-automator.start', async () => {
            if (agentCooperationActive) {
                vscode.window.showInformationMessage('Copilot Automator is already running.');
                sendToAutomatorPanel('System: Copilot Automator is already running.');
                return;
            }
            agentCooperationActive = true;
            agentCooperationPaused = false;
            const goal = await vscode.window.showInputBox({ prompt: 'What is your cooperation goal for Copilot?' });
            if (!goal) {
                vscode.window.showWarningMessage('No goal provided. Cooperation cancelled.');
                sendToAutomatorPanel('System: No goal provided. Cooperation cancelled.');
                agentCooperationActive = false;
                return;
            }
            // goal is persisted via setAgentCooperationGoal; no local variable needed
            await setAgentCooperationGoal(context, goal);
            await context.globalState.update('agentCooperationPaused', false);
            logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_STARTED', goal, logFilePath);
            sendToAutomatorPanel('System: Agent cooperation started. Goal: ' + goal);
            historyProvider.add(new HistoryItem('Cooperation started', goal));
            agentCooperationMain(goal, historyProvider);
        }),
        vscode.commands.registerCommand('copilot-automator.pause', async () => {
            if (agentCooperationActive && !agentCooperationPaused) {
                agentCooperationPaused = true;
                await context.globalState.update('agentCooperationPaused', true);
                vscode.window.showInformationMessage('Copilot Automator paused.');
                sendToAutomatorPanel('System: Copilot Automator paused.');
                logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_PAUSED', 'Paused by user.', logFilePath);
                historyProvider.add(new HistoryItem('Cooperation paused', 'Paused by user'));
            }
        }),
        vscode.commands.registerCommand('copilot-automator.resume', async () => {
            if (agentCooperationActive && agentCooperationPaused) {
                agentCooperationPaused = false;
                await context.globalState.update('agentCooperationPaused', false);
                vscode.window.showInformationMessage('Copilot Automator resumed.');
                sendToAutomatorPanel('System: Copilot Automator resumed.');
                logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_RESUMED', 'Resumed by user.', logFilePath);
                historyProvider.add(new HistoryItem('Cooperation resumed', 'Resumed by user'));
                // if (agentCooperationGoal) {
                //     agentCooperationLoop = setTimeout(() => agentCooperationMain(agentCooperationGoal as string, historyProvider), 0);
                // }
            }
        }),
        vscode.commands.registerCommand('copilot-automator.stop', async () => {
            agentCooperationActive = false;
            agentCooperationPaused = false;
            // goal is cleared via clearAgentCooperationGoal; no local variable needed
            await context.globalState.update('agentCooperationPaused', false);
            await clearAgentCooperationGoal(context);
            if (agentCooperationLoop) {
                clearTimeout(agentCooperationLoop);
                agentCooperationLoop = undefined;
            }
            logInteraction(LOG_LEVEL_INFO, 'AGENT_COOPERATION_STOPPED', 'Cooperation stopped by user.', logFilePath);
            historyProvider.add(new HistoryItem('Cooperation stopped', 'Stopped by user'));
            vscode.window.showInformationMessage('Copilot Automator stopped.');
            sendToAutomatorPanel('System: Copilot Automator stopped.');
        }),
        vscode.commands.registerCommand('copilot-automator.openSettings', () => {
            openSettingsPanel(context);
        }),
        vscode.commands.registerCommand('copilot-automator.selectFiles', async () => {
            await flexibleFileSelection();
            const selectedFiles = AgentCooperationState.instance.selectedFiles;
            if (selectedFiles.length > 0) {
                const fileNames = selectedFiles.map((f: string) => path.basename(f)).join(', ');
                historyProvider.add(new HistoryItem('Files Selected', fileNames));
            } else {
                historyProvider.add(new HistoryItem('No Files Selected', 'File selection cancelled.'));
            }
        }),
        vscode.commands.registerCommand('copilot-automator.manageSpecResources', () => {
            openSpecResourcesPanel(context);
        }),
        vscode.commands.registerCommand('copilot-automator.createTemplateInstruction', () => {
            openCreateTemplateInstructionsPanel(context);
        }),
        vscode.commands.registerCommand('copilot-automator.validateInstructions', () => {
            validateInstructionFiles();
        }),
        vscode.commands.registerCommand('copilot-automator.runInstructionFile', () => {
            runAutomationFromInstructionFile();
        }),
        vscode.commands.registerCommand('copilot-automator.openLogViewer', () => {
            openLogViewerPanel();
        }),
        vscode.commands.registerCommand('copilot-automator.refreshModels', () => modelsProvider.refresh()),
        vscode.commands.registerCommand('copilot-automator.load', async () => {
            const modelKey = await vscode.window.showInputBox({ prompt: 'Enter model key to load:' });
            if (modelKey) {
                const lmstudioManager = await import('./components/lmstudioManager');
                await lmstudioManager.loadModel(modelKey);
                vscode.window.showInformationMessage(`Model loaded: ${modelKey}`);
                await modelsProvider.refresh();
            }
        }),
        vscode.commands.registerCommand('copilot-automator.unload', async () => {
            const modelKey = await vscode.window.showInputBox({ prompt: 'Enter model key to unload:' });
            if (modelKey) {
                const lmstudioManager = await import('./components/lmstudioManager');
                await lmstudioManager.unloadModel(modelKey);
                vscode.window.showInformationMessage(`Model unloaded: ${modelKey}`);
                await modelsProvider.refresh();
            }
        }),
        vscode.commands.registerCommand('copilot-automator.selectModel', async (model: string) => {
            await modelsProvider.selectModel(model);
            vscode.commands.executeCommand('copilot-automator.refreshLocalChatPanel');
        })
    );

    modelsProvider.refresh();
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
        llmApiUrl: context.globalState.get('llmApiUrl', DEFAULT_LLM_API_URL),
        llmModel: context.globalState.get('llmModel', DEFAULT_LLM_MODEL),
        llmTemp: context.globalState.get('llmTemp', DEFAULT_LLM_TEMPERATURE),
        maxPrompts: context.globalState.get('maxPrompts', AgentCooperationState.instance.MAX_PROMPTS_PER_SESSION),
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


// If flexibleFileSelection is not implemented, provide a stub
// (If it is implemented, this will be ignored by the import above)
// function flexibleFileSelection() { vscode.window.showInformationMessage('flexibleFileSelection is not implemented.'); }




export function deactivate() {
    agentCooperationActive = false;
    agentCooperationPaused = false;
    if (agentCooperationLoop) {
        clearTimeout(agentCooperationLoop);
        agentCooperationLoop = undefined;
    }
}