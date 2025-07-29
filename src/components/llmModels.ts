import * as vscode from 'vscode';
import axios from 'axios';
import { logInteraction, LOG_LEVEL_INFO, LOG_LEVEL_ERROR } from './history';
import { LLM_API_URL, LLM_MODEL } from './commands';

export class LLMModelItem {
    constructor(public readonly label: string) {}
}

export class LLMModelsProvider implements vscode.TreeDataProvider<LLMModelItem> {
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
        this._onDidChangeTreeData.fire();
        vscode.window.showInformationMessage(`Selected LLM model: ${model}`);
        logInteraction(LOG_LEVEL_INFO, 'LLM_MODEL_SELECTED', model, this.context.extensionPath + '/copilot_interactions.log');
    }

    async refresh() {
        try {
            const apiUrl = LLM_API_URL.replace(/\/v1\/chat\/completions$/, '/v1/models');
            const response = await axios.get(apiUrl, { timeout: 5000 });
            this.models = response.data.data?.map((m: any) => m.id) || [];
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
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        if (element.label === this.selectedModel) {
            item.description = 'Selected';
        }
        item.command = { command: 'copilot-automator.selectModel', title: 'Select Model', arguments: [element.label] };
        return item;
    }

    getChildren(): Thenable<LLMModelItem[]> {
        return Promise.resolve(this.models.map(m => new LLMModelItem(m)));
    }
}