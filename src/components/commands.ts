import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { HistoryProvider, addPromptHistory, getPromptHistory, logInteraction, HistoryItem } from './history';
import { getLastCopilotChatResponse as mappedGetLastCopilotChatResponse, sendPromptToChat as mappedSendPromptToChat, resolveUITextAreaMapping } from '../commands';
import { AutomatorPanelBridge } from './automatorPanelBridge';

const logFilePath = path.join(__dirname, '../../copilot_interactions.log');

// --- Constants ---
const LOG_LEVEL_ERROR = 'ERROR';
const LOG_LEVEL_WARNING = 'WARNING';
const LOG_LEVEL_INFO = 'INFO';
const INSTRUCTIONS_FOLDER = 'instructions';
const MAX_FILE_SIZE = 1024 * 1024 * 2; // 2MB
const URL_CACHE: { [url: string]: { content: string; timestamp: number } } = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const PROMPT_DELAY_MS = 2000;

// --- State ---
export let promptCount = 0;
export let MAX_PROMPTS_PER_SESSION = 10;
export let agentCooperationActive = false;
export let agentCooperationPaused = false;
export let agentCooperationGoal: string | undefined;
export let agentCooperationLoop: NodeJS.Timeout | undefined;
export let selectedFiles: string[] = [];
export let LLM_API_URL = 'http://localhost:1234/v1/chat/completions';
export let LLM_MODEL = 'llama-3.2-3b-instruct'; // Default, but always use globalState at runtime
export let LLM_TEMPERATURE = 0.7;
export let CONTEXT_SOURCE = 'editor';
export let FILE_REVIEW_PATHS = '';
export let SPEC_RESOURCE_URLS = '';
export const LLM_ENDPOINTS: { label: string; url: string }[] = [
    { label: 'Local LLM', url: 'http://localhost:1234/v1/chat/completions' },
    { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
    { label: 'Grok', url: 'https://grok.api.example.com/v1/chat/completions' }
];

// --- Instruction File Management ---
interface InstructionStep {
    action: string;
    prompt?: string;
    condition?: { type: string; value: any };
    storeAs?: string;
    [key: string]: any;
}

export async function runAutomationFromInstructionFile(historyProvider: HistoryProvider) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (!instructionsDir) {
        logInteraction(LOG_LEVEL_ERROR, 'NO_WORKSPACE', 'No workspace folder for instruction files.', logFilePath);
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }
    const files = fs.readdirSync(instructionsDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        vscode.window.showWarningMessage('No instruction files found.');
        logInteraction(LOG_LEVEL_WARNING, 'NO_INSTRUCTION_FILES', 'No JSON files in instructions folder.', logFilePath);
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
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to parse instruction file: ${errorMessage}`);
        logInteraction(LOG_LEVEL_ERROR, 'INVALID_INSTRUCTION_FILE', `File ${filePath}: ${errorMessage}`, logFilePath);
        return;
    }
    const variables: { [key: string]: any } = {};
    for (const [i, step] of steps.entries()) {
        try {
            switch (step.action) {
                case 'sendPrompt': {
                    if (!step.prompt) throw new Error('Missing prompt in step.');
                    let prompt = step.prompt;
                    for (const key in variables) {
                        prompt = prompt.replace(`{{${key}}}`, variables[key]);
                    }
                    // Deep integration: use mapping if target is specified
                    if (step.target) {
                        const mapping = resolveUITextAreaMapping(step.target);
                        if (mapping) {
                            // Optionally, you could pass mapping info to mappedSendPromptToChat
                            await mappedSendPromptToChat(prompt); // mapping-aware
                            historyProvider.add(new HistoryItem('Prompt Sent (Mapping)', `Step ${i + 1}: Used mapping for target '${step.target}'`));
                        } else {
                            historyProvider.add(new HistoryItem('Mapping Not Found', `Step ${i + 1}: No mapping for target '${step.target}', using fallback`));
                            await mappedSendPromptToChat(prompt);
                        }
                    } else {
                        await mappedSendPromptToChat(prompt);
                    }
                    if (step.storeAs) {
                        variables[step.storeAs] = prompt;
                    }
                    break;
                }
                case 'acceptSuggestion':
                    await acceptCopilotSuggestion();
                    break;
                default:
                    historyProvider.add(new HistoryItem('Unknown Step', `Step ${i + 1}: ${JSON.stringify(step)}`));
                    logInteraction(LOG_LEVEL_WARNING, 'UNKNOWN_STEP', step, logFilePath);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            historyProvider.add(new HistoryItem('Step Failed', `Step ${i + 1}: ${errorMessage}`));
            logInteraction(LOG_LEVEL_ERROR, 'STEP_FAILED', { step, error: errorMessage }, logFilePath);
            vscode.window.showErrorMessage(`Step ${i + 1} failed: ${errorMessage}`);
            break;
        }
    }
    vscode.window.showInformationMessage('Automation job complete.');
    logInteraction(LOG_LEVEL_INFO, 'INSTRUCTION_JOB_COMPLETED', `File: ${filePath}`, logFilePath);
}

export async function validateAllInstructionFiles() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (!instructionsDir) {
        vscode.window.showErrorMessage('No workspace folder found.');
        logInteraction(LOG_LEVEL_ERROR, 'NO_WORKSPACE', 'No workspace folder for validation.', logFilePath);
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
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            errors.push(`${file}: Invalid JSON (${errorMessage})`);
        }
    }
    let summary = '';
    if (errors.length === 0 && warnings.length === 0) {
        summary = 'All instruction files are valid.';
        vscode.window.showInformationMessage(summary);
    } else {
        if (errors.length > 0) summary += 'Errors:\n' + errors.join('\n') + '\n';
        if (warnings.length > 0) summary += 'Warnings:\n' + warnings.join('\n');
        vscode.window.showErrorMessage(summary, { modal: true });
    }
    logInteraction(LOG_LEVEL_INFO, 'INSTRUCTION_FILES_VALIDATED', { errors, warnings }, logFilePath);
}

export async function createTemplateInstructionFile() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (!instructionsDir) {
        vscode.window.showErrorMessage('No workspace folder found.');
        logInteraction(LOG_LEVEL_ERROR, 'NO_WORKSPACE', 'No workspace folder for template creation.', logFilePath);
        return;
    }
    const defaultName = `instruction-${Date.now()}.json`;
    const fileName = await vscode.window.showInputBox({ prompt: 'Enter a name for the new instruction file', value: defaultName });
    if (!fileName) return;
    const filePath = path.join(instructionsDir, fileName.endsWith('.json') ? fileName : fileName + '.json');
    if (fs.existsSync(filePath)) {
        vscode.window.showWarningMessage('File already exists.');
        logInteraction(LOG_LEVEL_WARNING, 'TEMPLATE_FILE_EXISTS', `File: ${filePath}`, logFilePath);
        return;
    }
    const template = {
        description: 'Describe the automation goal or instruction.',
        steps: [
            { action: 'sendPrompt', prompt: 'Your prompt here.', storeAs: 'result' },
            { action: 'acceptSuggestion' }
        ]
    };
    try {
        fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
        logInteraction(LOG_LEVEL_INFO, 'TEMPLATE_CREATED', `File: ${filePath}`, logFilePath);
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Template instruction file created: ${filePath}`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
    logInteraction(LOG_LEVEL_ERROR, 'TEMPLATE_CREATION_FAILED', `File: ${filePath}, Error: ${errorMessage}`, logFilePath);
        vscode.window.showErrorMessage(`Failed to create template: ${errorMessage}`);
    }
}

export async function flexibleFileSelection() {
    const options = ['Multi-select files', 'Enter glob pattern', 'Manual file path entry'];
    const choice = await vscode.window.showQuickPick(options, { placeHolder: 'How would you like to select files for LLM review?' });
    if (!choice) return;
    let files: string[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open.');
    logInteraction(LOG_LEVEL_ERROR, 'NO_WORKSPACE', 'No workspace for file selection.', logFilePath);
        return;
    }
    const root = workspaceFolders[0].uri.fsPath;
    if (choice === 'Multi-select files') {
        const uris = await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, openLabel: 'Select Files for LLM Review' });
        if (uris && uris.length > 0) {
            files = uris.map(u => u.fsPath);
        }
    } else if (choice === 'Enter glob pattern') {
        const pattern = await vscode.window.showInputBox({ prompt: 'Enter a glob pattern (e.g., src/**/*.ts)' });
        if (pattern) {
            try {
                files = glob.sync(pattern, { cwd: root, absolute: true });
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(`Invalid glob pattern: ${errorMessage}`);
                logInteraction(LOG_LEVEL_ERROR, 'INVALID_GLOB_PATTERN', errorMessage, logFilePath);
            }
        }
    } else if (choice === 'Manual file path entry') {
        const input = await vscode.window.showInputBox({ prompt: 'Enter file paths, comma-separated' });
        if (input) {
            files = input.split(',').map(f => path.resolve(root, f.trim())).filter(f => fs.existsSync(f));
        }
    }
    if (files.length > 0) {
        selectedFiles = files.filter(f => f.startsWith(root));
        const fileNames = selectedFiles.map(f => path.basename(f)).join(', ');
    logInteraction(LOG_LEVEL_INFO, 'FLEXIBLE_FILES_SELECTED', `Selected files: ${fileNames}`, logFilePath);
        vscode.window.showInformationMessage(`Selected ${selectedFiles.length} file(s) for LLM review.`);
    } else {
        vscode.window.showWarningMessage('No files selected.');
    logInteraction(LOG_LEVEL_WARNING, 'FILES_SELECTION_CANCELLED', 'No files selected.', logFilePath);
    }
}

export async function getFilesForLLMReview(): Promise<string> {
    let fileContents = '';
    const patterns = FILE_REVIEW_PATHS ? FILE_REVIEW_PATHS.split(',').map(p => p.trim()) : [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return 'No workspace folder open.';

    const instructionsDir = ensureInstructionsFolder(workspaceFolders);
    if (instructionsDir) patterns.push(path.join(INSTRUCTIONS_FOLDER, '*.json'));

    if (selectedFiles.length > 0) {
        for (const filePath of selectedFiles) {
            if (!filePath.startsWith(workspaceFolders[0].uri.fsPath)) {
                logInteraction(LOG_LEVEL_WARNING, 'FILE_ACCESS_DENIED', `File ${filePath} is outside workspace.`, logFilePath);
                vscode.window.showWarningMessage(`File ${path.basename(filePath)} is outside workspace and will be skipped.`);
                continue;
            }
            try {
                const stats = fs.statSync(filePath);
                let content = '';
                if (stats.size > MAX_FILE_SIZE) {
                    const fd = fs.openSync(filePath, 'r');
                    const buffer = Buffer.alloc(MAX_FILE_SIZE);
                    fs.readSync(fd, buffer, 0, MAX_FILE_SIZE, 0);
                    fs.closeSync(fd);
                    content = buffer.toString('utf-8') + '\n[Truncated: file too large]';
                    logInteraction(LOG_LEVEL_WARNING, 'FILE_TRUNCATED', `File truncated: ${filePath}`, logFilePath);
                } else {
                    content = fs.readFileSync(filePath, 'utf-8');
                }
                if (filePath.startsWith(path.join(workspaceFolders[0].uri.fsPath, INSTRUCTIONS_FOLDER)) && filePath.endsWith('.json')) {
                    try {
                        JSON.parse(content);
                    } catch (err: unknown) {
                        const errorMessage = err instanceof Error ? err.message : String(err);
                        logInteraction(LOG_LEVEL_ERROR, 'INVALID_JSON', `Invalid JSON in ${filePath}: ${errorMessage}`, logFilePath);
                        vscode.window.showErrorMessage(`Invalid JSON in ${path.basename(filePath)}: ${errorMessage}`);
                        continue;
                    }
                }
                fileContents += `\n\nFile: ${filePath}\n${content}`;
                logInteraction(LOG_LEVEL_INFO, 'FILE_REVIEW', `Read file: ${filePath}`, logFilePath);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logInteraction(LOG_LEVEL_ERROR, 'FILE_READ_FAILED', `Failed to read file ${filePath}: ${errorMessage}`, logFilePath);
                vscode.window.showErrorMessage(`Failed to read file ${path.basename(filePath)}: ${errorMessage}`);
            }
        }
    }

    if (patterns.length > 0 && workspaceFolders) {
        const root = workspaceFolders[0].uri.fsPath;
        for (const pattern of patterns) {
            try {
                const files = glob.sync(pattern, { cwd: root, absolute: true });
                for (const filePath of files) {
                    if (!filePath.startsWith(root)) {
                        logInteraction(LOG_LEVEL_WARNING, 'FILE_ACCESS_DENIED', `File ${filePath} is outside workspace.`, logFilePath);
                        vscode.window.showWarningMessage(`File ${path.basename(filePath)} is outside workspace and will be skipped.`);
                        continue;
                    }
                    try {
                        const stats = fs.statSync(filePath);
                        let content = '';
                        if (stats.size > MAX_FILE_SIZE) {
                            const fd = fs.openSync(filePath, 'r');
                            const buffer = Buffer.alloc(MAX_FILE_SIZE);
                            fs.readSync(fd, buffer, 0, MAX_FILE_SIZE, 0);
                            fs.closeSync(fd);
                            content = buffer.toString('utf-8') + '\n[Truncated: file too large]';
                            logInteraction(LOG_LEVEL_WARNING, 'FILE_TRUNCATED', `File truncated: ${filePath}`, logFilePath);
                        } else {
                            content = fs.readFileSync(filePath, 'utf-8');
                        }
                        if (filePath.startsWith(path.join(root, INSTRUCTIONS_FOLDER)) && filePath.endsWith('.json')) {
                            try {
                                JSON.parse(content);
                            } catch (err: unknown) {
                                const errorMessage = err instanceof Error ? err.message : String(err);
                                logInteraction(LOG_LEVEL_ERROR, 'INVALID_JSON', `Invalid JSON in ${filePath}: ${errorMessage}`, logFilePath);
                                vscode.window.showErrorMessage(`Invalid JSON in ${path.basename(filePath)}: ${errorMessage}`);
                                continue;
                            }
                        }
                        fileContents += `\n\nFile: ${filePath}\n${content}`;
                        logInteraction(LOG_LEVEL_INFO, 'FILE_REVIEW', `Read file: ${filePath}`, logFilePath);
                    } catch (err: unknown) {
                        const errorMessage = err instanceof Error ? err.message : String(err);
                        logInteraction(LOG_LEVEL_ERROR, 'FILE_READ_FAILED', `Failed to read file ${filePath}: ${errorMessage}`, logFilePath);
                        vscode.window.showErrorMessage(`Failed to read file ${path.basename(filePath)}: ${errorMessage}`);
                    }
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logInteraction(LOG_LEVEL_ERROR, 'PATTERN_PROCESSING_FAILED', `Failed to process pattern ${pattern}: ${errorMessage}`, logFilePath);
                vscode.window.showErrorMessage(`Failed to process file pattern ${pattern}: ${errorMessage}`);
            }
        }
    }

    if (!fileContents) {
    logInteraction(LOG_LEVEL_INFO, 'NO_FILES_REVIEWED', 'No files selected or matched for LLM review.', logFilePath);
        vscode.window.showInformationMessage('No files available for LLM review.');
    }
    return fileContents || 'No file content available for review.';
}

export async function fetchSpecResources(): Promise<string> {
    let specContent = '';
    const urls = SPEC_RESOURCE_URLS ? SPEC_RESOURCE_URLS.split(',').map(url => url.trim()).filter(url => url) : [];
    for (const url of urls) {
        try {
            new URL(url);
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new Error('Invalid protocol');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logInteraction(LOG_LEVEL_ERROR, 'INVALID_URL', `Invalid URL ${url}: ${errorMessage}`, logFilePath);
            vscode.window.showErrorMessage(`Invalid URL ${url}: ${errorMessage}`);
            continue;
        }
        if (URL_CACHE[url] && Date.now() - URL_CACHE[url].timestamp < CACHE_TTL_MS) {
            specContent += `\n\nSpecification Resource (Cached): ${url}\n${URL_CACHE[url].content}`;
            logInteraction(LOG_LEVEL_INFO, 'SPEC_RESOURCE_CACHED', `Used cached content for ${url}`, logFilePath);
            continue;
        }
        try {
            const response = await axios.get(url, { timeout: 5000 });
            let data = response.data;
            if (typeof data === 'string' && data.length > MAX_FILE_SIZE) {
                data = data.slice(0, MAX_FILE_SIZE) + '\n[Truncated: resource too large]';
                logInteraction(LOG_LEVEL_WARNING, 'SPEC_RESOURCE_TRUNCATED', `Resource truncated: ${url}`, logFilePath);
            }
            specContent += `\n\nSpecification Resource: ${url}\n${data}`;
            URL_CACHE[url] = { content: data, timestamp: Date.now() };
            logInteraction(LOG_LEVEL_INFO, 'SPEC_RESOURCE_FETCHED', `Fetched content from ${url}`, logFilePath);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logInteraction(LOG_LEVEL_ERROR, 'SPEC_RESOURCE_FETCH_FAILED', `Failed to fetch ${url}: ${errorMessage}`, logFilePath);
            vscode.window.showErrorMessage(`Failed to fetch specification resource ${url}: ${errorMessage}`);
        }
    }
    if (!specContent) {
    logInteraction(LOG_LEVEL_INFO, 'NO_SPEC_RESOURCES', 'No specification resources available.', logFilePath);
        vscode.window.showInformationMessage('No specification resources available.');
    }
    return specContent || 'No specification resource content available.';
}

export async function generatePromptFromLocalLLM(contextualInfo: string, fileContents: string, specContents: string, isRetry: boolean = false): Promise<string> {
    try {
        // Always get the latest model from globalState (if available)
        let model = LLM_MODEL;
        try {
            const ext = vscode.extensions.getExtension('mediaprophet.vs-code-agent-collab');
            const context = ext?.exports?.extensionContext as vscode.ExtensionContext | undefined;
            if (context) {
                model = context.globalState.get('llmModel', LLM_MODEL);
            }
        } catch {}
        const history = getPromptHistory(5);
        const historyContext = history.length > 0 ? `\n\nRecent Prompt History:\n${history.map(h => `Prompt: ${h.prompt}\nResponse: ${h.response || 'None'}`).join('\n')}` : '';
        const payload = {
            model,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert coding assistant. When generating the next prompt for Copilot, enclose it strictly in <copilot_instructions> and </copilot_instructions> tags. Any other thoughts, explanations, or additional content should be outside these tags. If an error occurs, consult the specification resources: ${SPEC_RESOURCE_URLS}.`
                },
                {
                    role: 'user',
                    content: `${contextualInfo}\n\nFiles for review:\n${fileContents}\n\nSpecification Resources:\n${specContents}${historyContext}${isRetry ? '\n\nPrevious attempt failed. Review specifications and try again.' : ''}`
                }
            ],
            temperature: LLM_TEMPERATURE,
            max_tokens: -1,
            stream: false
        };
        const response = await axios.post(LLM_API_URL, payload);
        let content = response.data.choices?.[0]?.message?.content || '';
        logInteraction(LOG_LEVEL_INFO, 'LOCAL_LLM_REQUEST', { request: payload, response: content }, logFilePath);
        const match = content.match(/<copilot_instructions>([\s\S]*?)<\/copilot_instructions>/);
        if (match && match[1]) {
            content = match[1].trim();
            logInteraction(LOG_LEVEL_INFO, 'PROMPT_EXTRACTED', content, logFilePath);
        } else {
            logInteraction(LOG_LEVEL_WARNING, 'NO_INSTRUCTIONS_TAG', 'No <copilot_instructions> tag found, using full content.', logFilePath);
            vscode.window.showWarningMessage('No <copilot_instructions> tags found in LLM response.');
        }
        addPromptHistory(contextualInfo, content);
        return content;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logInteraction(LOG_LEVEL_ERROR, 'LOCAL_LLM_REQUEST', errorMessage, logFilePath);
        vscode.window.showErrorMessage(`LLM request failed: ${errorMessage}`);
        return '';
    }
}

// Deprecated: use mappedSendPromptToChat for mapping support
export async function sendPromptToChat(promptText: string, historyProvider: HistoryProvider) {
    if (!promptText) {
    logInteraction(LOG_LEVEL_ERROR, 'INVALID_PROMPT', 'Empty prompt provided.', logFilePath);
        vscode.window.showErrorMessage('Cannot send empty prompt to Copilot.');
        return;
    }
    const approval = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Approve sending this prompt to Copilot? "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`
    });
    if (approval !== 'Yes') {
    logInteraction(LOG_LEVEL_INFO, 'PROMPT_DENIED', promptText, logFilePath);
        historyProvider.add(new HistoryItem('Prompt Denied', promptText.substring(0, 50)));
        vscode.window.showInformationMessage('Prompt denied by user.');
        return;
    }
    if (promptText.toLowerCase().includes('run')) {
        const runApproval = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: `This prompt includes a potential run request. Proceed? "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`
        });
        if (runApproval !== 'Yes') {
            logInteraction(LOG_LEVEL_INFO, 'RUN_REQUEST_DENIED', promptText, logFilePath);
            historyProvider.add(new HistoryItem('Run Request Denied', promptText.substring(0, 50)));
            vscode.window.showInformationMessage('Run request denied by user.');
            return;
        }
    }
    if (promptCount >= MAX_PROMPTS_PER_SESSION) {
        try {
            await vscode.commands.executeCommand('workbench.action.closePanel');
            promptCount = 0;
            logInteraction(LOG_LEVEL_INFO, 'CHAT_SESSION_RESET', 'Session reset after max prompts.', logFilePath);
            vscode.window.showInformationMessage('Chat session reset.');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logInteraction(LOG_LEVEL_ERROR, 'SESSION_RESET_FAILED', errorMessage, logFilePath);
            vscode.window.showErrorMessage(`Failed to reset chat session: ${errorMessage}`);
        }
    }
    // Use the mapping-aware function
    await mappedSendPromptToChat(promptText);
    promptCount++;
    logInteraction(LOG_LEVEL_INFO, 'PROMPT_SENT', promptText, logFilePath);
    historyProvider.add(new HistoryItem('Prompt Sent', promptText.substring(0, 50)));
    vscode.window.showInformationMessage('Prompt sent to Copilot.');
    AutomatorPanelBridge.getInstance().sendDialogue('Prompt sent to Copilot: ' + promptText);
}

export async function acceptCopilotSuggestion() {
    await new Promise(resolve => setTimeout(resolve, PROMPT_DELAY_MS));
    try {
        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
    logInteraction(LOG_LEVEL_INFO, 'SUGGESTION_ACCEPTED', 'Accepted inline suggestion.', logFilePath);
        vscode.window.showInformationMessage('Accepted Copilot suggestion.');
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
    logInteraction(LOG_LEVEL_ERROR, 'SUGGESTION_ACCEPT_FAILED', errorMessage, logFilePath);
        vscode.window.showErrorMessage(`Failed to accept suggestion: ${errorMessage}`);
    }
}

// Deprecated: use mappedGetLastCopilotChatResponse for mapping support
export async function getLastCopilotChatResponse(): Promise<string> {
    return mappedGetLastCopilotChatResponse();
}

export async function agentCooperationMain(goal: string, historyProvider: HistoryProvider) {
    while (agentCooperationActive) {
        if (agentCooperationPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }
        const lastResponse = await getLastCopilotChatResponse();
        const fileContents = await getFilesForLLMReview();
        const specContents = await fetchSpecResources();
        if (lastResponse.includes('No active editor') || lastResponse.includes('not available')) {
            historyProvider.add(new HistoryItem('Warning', 'No editor context available for prompt generation.'));
            AutomatorPanelBridge.getInstance().sendDialogue('Warning: No editor context available for prompt generation.');
        }
        if (fileContents === 'No file content available for review.') {
            historyProvider.add(new HistoryItem('Warning', 'No files selected or matched for LLM review.'));
            AutomatorPanelBridge.getInstance().sendDialogue('Warning: No files selected or matched for LLM review.');
        }
        if (specContents === 'No specification resource content available.') {
            historyProvider.add(new HistoryItem('Warning', 'No specification resources available.'));
            AutomatorPanelBridge.getInstance().sendDialogue('Warning: No specification resources available.');
        }
        const contextualInfo = lastResponse.includes('No active editor') || lastResponse.includes('not available')
            ? `Current goal: ${goal}. No prior response available.`
            : `Prior response: ${lastResponse}. Goal: ${goal}.`;
        let nextPrompt = await generatePromptFromLocalLLM(contextualInfo, fileContents, specContents);
        if (!nextPrompt) {
            historyProvider.add(new HistoryItem('Warning', 'Failed to generate prompt, retrying with specifications.'));
            AutomatorPanelBridge.getInstance().sendDialogue('Warning: Failed to generate prompt, retrying with specifications.');
            nextPrompt = await generatePromptFromLocalLLM(contextualInfo, fileContents, specContents, true);
        }
        if (nextPrompt) {
            AutomatorPanelBridge.getInstance().sendDialogue('LLM: ' + nextPrompt);
            await sendPromptToChat(nextPrompt, historyProvider);
            await acceptCopilotSuggestion();
        } else {
            historyProvider.add(new HistoryItem('Error', 'Failed to generate next prompt.'));
            logInteraction(LOG_LEVEL_ERROR, 'PROMPT_GENERATION_FAILED', 'No prompt returned from LLM.', logFilePath);
            vscode.window.showErrorMessage('Failed to generate next prompt.');
            AutomatorPanelBridge.getInstance().sendDialogue('Error: Failed to generate next prompt.');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function ensureInstructionsFolder(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): string | undefined {
    if (!workspaceFolders || workspaceFolders.length === 0) {
    logInteraction(LOG_LEVEL_WARNING, 'NO_WORKSPACE', 'No workspace folders found for instructions folder creation.', logFilePath);
        vscode.window.showWarningMessage('No workspace open. Cannot create instructions folder.');
        return undefined;
    }
    const root = workspaceFolders[0].uri.fsPath;
    const instructionsDir = path.join(root, INSTRUCTIONS_FOLDER);
    try {
        if (!fs.existsSync(instructionsDir)) {
            fs.mkdirSync(instructionsDir, { recursive: true });
            logInteraction(LOG_LEVEL_INFO, 'INSTRUCTIONS_FOLDER_CREATED', `Created instructions folder at ${instructionsDir}`, logFilePath);
            vscode.window.showInformationMessage(`Created instructions folder at ${instructionsDir}`);
        }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
    logInteraction(LOG_LEVEL_ERROR, 'INSTRUCTIONS_FOLDER_CREATION_FAILED', errorMessage, logFilePath);
        vscode.window.showErrorMessage(`Failed to create instructions folder: ${errorMessage}`);
        return undefined;
    }
    return instructionsDir;
}