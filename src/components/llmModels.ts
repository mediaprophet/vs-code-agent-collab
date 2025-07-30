import * as vscode from 'vscode';

import { logInteraction, LOG_LEVEL_INFO, LOG_LEVEL_ERROR } from './history';
import * as lmstudioManager from './lmstudioManager';

// Represents a model or an action/memory info item in the LLM models tree
class LLMModelItem {
    public readonly label: string;
    public readonly isAction?: boolean;
    constructor(label: string, isAction?: boolean) {
        this.label = label;
        this.isAction = isAction;
    }
}

export class LLMModelsProvider implements vscode.TreeDataProvider<LLMModelItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LLMModelItem | undefined | void> = new vscode.EventEmitter<LLMModelItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<LLMModelItem | undefined | void> = this._onDidChangeTreeData.event;
    private models: string[] = [];
    private selectedModel: string | undefined;
    private memoryInfo: string | undefined;

    constructor(private context: vscode.ExtensionContext) {
    this.selectedModel = context.globalState.get('llmModel', undefined);
    }

    async selectModel(model: string) {
        try {
            await lmstudioManager.loadModel(model);
            this.selectedModel = model;
            await this.context.globalState.update('llmModel', model);
            this._onDidChangeTreeData.fire();
            vscode.window.showInformationMessage(`Loaded and selected LLM model: ${model}`);
            logInteraction(LOG_LEVEL_INFO, 'LLM_MODEL_SELECTED', model, this.context.extensionPath + '/copilot_interactions.log');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Failed to load model: ${errorMessage}`);
            logInteraction(LOG_LEVEL_ERROR, 'LLM_MODEL_LOAD_FAILED', errorMessage, this.context.extensionPath + '/copilot_interactions.log');
        }
    }

    async refresh() {
        try {
            const localModels = await lmstudioManager.listLocalModels();
            this.models = localModels.map((m: any) => m.modelKey);
            const memInfo = await lmstudioManager.getMemoryInfo();
            this.memoryInfo = memInfo.gpu ? `System: ${memInfo.system}, GPU: ${memInfo.gpu}` : `System: ${memInfo.system}`;
            logInteraction(LOG_LEVEL_INFO, 'LLM_MODELS_REFRESHED', `Fetched ${this.models.length} models`, this.context.extensionPath + '/copilot_interactions.log');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.models = [];
            logInteraction(LOG_LEVEL_ERROR, 'LLM_MODELS_FETCH_FAILED', errorMessage, this.context.extensionPath + '/copilot_interactions.log');
            vscode.window.showErrorMessage(`Failed to refresh LLM models: ${errorMessage}`);
        }
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: LLMModelItem): vscode.TreeItem {
        if (element.isAction) {
            // Action buttons
            const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
            item.command = { command: `copilot-automator.${element.label.toLowerCase()}`, title: element.label };
            item.iconPath = new vscode.ThemeIcon(element.label === 'Refresh' ? 'refresh' : element.label === 'Load' ? 'cloud-upload' : element.label === 'Unload' ? 'cloud-download' : 'info');
            return item;
        }
        // Model item
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        if (element.label === this.selectedModel) {
            item.description = 'Selected';
        }
        item.contextValue = 'llmModel';
        item.command = { command: 'copilot-automator.selectModel', title: 'Select Model', arguments: [element.label] };
        return item;
    }

    getChildren(): Thenable<LLMModelItem[]> {
        // Top: action buttons
        const actions = [
            new LLMModelItem('Refresh', true),
            new LLMModelItem('Load', true),
            new LLMModelItem('Unload', true)
        ];
        // Memory info
        const memory = this.memoryInfo ? [new LLMModelItem(`Memory: ${this.memoryInfo}`, true)] : [];
        // Models
        const models = this.models.map(m => new LLMModelItem(m));
        return Promise.resolve([...actions, ...memory, ...models]);
    }
}