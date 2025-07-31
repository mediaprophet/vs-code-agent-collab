
import * as vscode from 'vscode';
import { logInteraction, LOG_LEVEL_INFO, LOG_LEVEL_ERROR } from './history';
import * as lmstudioManager from './lmstudioManager';


/**
 * Represents a model or an action/memory info item in the LLM models tree.
 */
class LLMModelItem {
    public readonly label: string;
    public readonly isAction?: boolean;
    public readonly modelKey?: string;
    public readonly isLoaded?: boolean;
    constructor(label: string, isAction?: boolean, modelKey?: string, isLoaded?: boolean) {
        this.label = label;
        this.isAction = isAction;
        this.modelKey = modelKey;
        this.isLoaded = isLoaded;
    }
}

/**
 * TreeDataProvider for LLM models, actions, and memory info.
 */
export class LLMModelsProvider implements vscode.TreeDataProvider<LLMModelItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LLMModelItem | undefined | void> = new vscode.EventEmitter<LLMModelItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<LLMModelItem | undefined | void> = this._onDidChangeTreeData.event;

    private models: Array<{ modelKey: string }> = [];
    private loadedModels: string[] = [];
    private selectedModel: string | undefined;
    private memoryInfo: string | undefined;
    private loading: boolean = false;

    constructor(private context: vscode.ExtensionContext) {
        this.selectedModel = context.globalState.get('llmModel', undefined);
    }

    async selectModel(model: string) {
        try {
            this.loading = true;
            this._onDidChangeTreeData.fire();
            await lmstudioManager.loadModel(model);
            this.selectedModel = model;
            await this.context.globalState.update('llmModel', model);
            await this.refresh();
            vscode.window.showInformationMessage(`Loaded and selected LLM model: ${model}`);
            logInteraction(LOG_LEVEL_INFO, 'LLM_MODEL_SELECTED', model, this.context.extensionPath + '/copilot_interactions.log');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Failed to load model: ${errorMessage}`);
            logInteraction(LOG_LEVEL_ERROR, 'LLM_MODEL_LOAD_FAILED', errorMessage, this.context.extensionPath + '/copilot_interactions.log');
        } finally {
            this.loading = false;
            this._onDidChangeTreeData.fire();
        }
    }

    /**
     * Refreshes the list of local and loaded models, and memory info.
     */
    async refresh() {
        try {
            this.loading = true;
            this._onDidChangeTreeData.fire();
            const localModels = await lmstudioManager.listLocalModels();
            this.models = localModels;
            const loaded: Array<{ modelKey: string }> = await lmstudioManager.listLoadedModels();
            this.loadedModels = loaded.map(m => m.modelKey);
            const memInfo: { system: string; gpu?: string } = await lmstudioManager.getMemoryInfo();
            this.memoryInfo = memInfo.gpu ? `System: ${memInfo.system}, GPU: ${memInfo.gpu}` : `System: ${memInfo.system}`;
            logInteraction(LOG_LEVEL_INFO, 'LLM_MODELS_REFRESHED', `Fetched ${this.models.length} models`, this.context.extensionPath + '/copilot_interactions.log');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.models = [];
            this.loadedModels = [];
            logInteraction(LOG_LEVEL_ERROR, 'LLM_MODELS_FETCH_FAILED', errorMessage, this.context.extensionPath + '/copilot_interactions.log');
            vscode.window.showErrorMessage(`Failed to refresh LLM models: ${errorMessage}`);
        } finally {
            this.loading = false;
            this._onDidChangeTreeData.fire();
        }
    }

    getTreeItem(element: LLMModelItem): vscode.TreeItem {
        if (element.isAction) {
            // Action buttons
            const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
            // Use the correct command for refresh
            const commandName = element.label === 'Refresh' ? 'copilot-automator.refreshModels' : `copilot-automator.${element.label.toLowerCase()}`;
            item.command = { command: commandName, title: element.label };
            item.iconPath = new vscode.ThemeIcon(element.label === 'Refresh' ? 'refresh' : element.label === 'Load' ? 'cloud-upload' : element.label === 'Unload' ? 'cloud-download' : 'info');
            return item;
        }
        // Model item
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        if (element.label === this.selectedModel) {
            item.description = 'Selected';
        }
        if (element.isLoaded) {
            item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')); // Show check for loaded
            item.tooltip = 'Loaded in memory';
        } else {
            item.iconPath = new vscode.ThemeIcon('circle-outline');
            item.tooltip = 'Not loaded';
        }
        item.contextValue = 'llmModel';
        item.command = { command: 'copilot-automator.selectModel', title: 'Select Model', arguments: [element.label] };
        // Add context menu actions
        item.contextValue = 'llmModel';
        item.contextValue += element.isLoaded ? ' loaded' : '';
        item.contextValue += element.modelKey ? ' hasKey' : '';
        return item;
    }

    getChildren(): Thenable<LLMModelItem[]> {
        if (this.loading) {
            return Promise.resolve([new LLMModelItem('Loading...', true)]);
        }
        // Top: action buttons
        const actions = [
            new LLMModelItem('Refresh', true),
            new LLMModelItem('Load', true),
            new LLMModelItem('Unload', true)
        ];
        // Memory info
        const memory = this.memoryInfo ? [new LLMModelItem(`Memory: ${this.memoryInfo}`, true)] : [];
        // Models
        const models = this.models.map(m => new LLMModelItem(m.modelKey, false, m.modelKey, this.loadedModels.includes(m.modelKey)));
        return Promise.resolve([...actions, ...memory, ...models]);
    }
}