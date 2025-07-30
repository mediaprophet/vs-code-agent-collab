import * as vscode from 'vscode';

// --- Constants ---
export const LOG_LEVEL_ERROR = 'ERROR';
export const LOG_LEVEL_WARNING = 'WARNING';
export const LOG_LEVEL_INFO = 'INFO';

// --- Prompt History ---
export interface PromptHistoryEntry {
    prompt: string;
    response?: string;
    timestamp: string;
}

export let promptHistory: PromptHistoryEntry[] = [];

export function addPromptHistory(prompt: string, response?: string) {
    promptHistory.push({ prompt, response, timestamp: new Date().toISOString() });
    if (promptHistory.length > 100) promptHistory.shift();
}

export function getPromptHistory(limit = 10): PromptHistoryEntry[] {
    return promptHistory.slice(-limit);
}

// --- Automation History / Logs Tree View ---
export class HistoryItem {
    constructor(
        public readonly label: string,
        public readonly description?: string,
        public readonly command?: vscode.Command
    ) {}
}

export class HistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem | undefined | void> = new vscode.EventEmitter<HistoryItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | void> = this._onDidChangeTreeData.event;
    private history: HistoryItem[] = [];
    private static readonly CONTROL_ITEMS = [
        new HistoryItem('▶️ Start Agent Cooperation', '', { command: 'copilot-automator.start', title: 'Start Agent Cooperation' }),
        new HistoryItem('⏸️ Pause Agent Cooperation', '', { command: 'copilot-automator.pause', title: 'Pause Agent Cooperation' }),
        new HistoryItem('▶️ Resume Agent Cooperation', '', { command: 'copilot-automator.resume', title: 'Resume Agent Cooperation' }),
        new HistoryItem('⏹️ Stop Agent Cooperation', '', { command: 'copilot-automator.stop', title: 'Stop Agent Cooperation' }),
        new HistoryItem('⚙️ Settings', '', { command: 'copilot-automator.openSettings', title: 'Open Settings' }),
        new HistoryItem('📜 Spec Resources', '', { command: 'copilot-automator.manageSpecResources', title: 'Manage Specification Resources' }),
        new HistoryItem('📝 Create Instruction Template', '', { command: 'copilot-automator.createTemplateInstruction', title: 'Create Instruction Template' }),
        new HistoryItem('✅ Validate Instructions', '', { command: 'copilot-automator.validateInstructions', title: 'Validate Instructions' }),
        new HistoryItem('🚀 Run Instruction File', '', { command: 'copilot-automator.runInstructionFile', title: 'Run Instruction File' }),
    new HistoryItem('📜 View Logs', '', { command: 'copilot-automator.openLogViewer', title: 'View Logs' }),
    new HistoryItem('🖌️ Map UI Text Area', '', { command: 'copilot-automator.mapUITextArea', title: 'Map UI Text Area' })
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
        return Promise.resolve([...HistoryProvider.CONTROL_ITEMS, ...this.history]);
    }
}

export function logInteraction(logLevel: string, action: string, message: any, logFilePath: string) {
    const entry = {
        timestamp: new Date().toISOString(),
        logLevel,
        action,
        message
    };
    try {
        require('fs').appendFileSync(logFilePath, JSON.stringify(entry) + '\n');
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Failed to write log:', errorMessage);
        vscode.window.showErrorMessage(`Failed to write to log file: ${errorMessage}`);
    }
}