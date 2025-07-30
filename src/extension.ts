import * as vscode from 'vscode';
import * as path from 'path';
import commandsJson from './copilot-automator-commands.json';
import { LLM_API_URL as DEFAULT_LLM_API_URL, LLM_MODEL as DEFAULT_LLM_MODEL, LLM_TEMPERATURE as DEFAULT_LLM_TEMPERATURE, LLM_ENDPOINTS, sendPromptToChat } from './components/llmHelpers';
import { validateInstructionFiles, createTemplateInstructionFile, acceptCopilotSuggestion } from './components/automation';
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
function openSpecResourcesPanel(_context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('openSpecResourcesPanel is not implemented.');
}
function openLogViewerPanel() {
    vscode.window.showInformationMessage('openLogViewerPanel is not implemented.');
}
function getSettingsHtml(_settings: any): string {
    return '<html><body><h2>Settings Panel (stub)</h2></body></html>';
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
            createTemplateInstructionFile();
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