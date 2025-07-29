import * as vscode from 'vscode';
import { logInteraction, LOG_LEVEL_ERROR } from './history';

export class CommandItem {
    constructor(
        public readonly label: string,
        public readonly description?: string
    ) {}
}

export class CommandsProvider implements vscode.TreeDataProvider<CommandItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandItem | undefined | void> = new vscode.EventEmitter<CommandItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<CommandItem | undefined | void> = this._onDidChangeTreeData.event;
    private commands: CommandItem[] = [];

    constructor(commandsJson: any) {
        try {
            this.commands = (commandsJson?.commands || []).map((cmd: any) => new CommandItem(cmd.command, cmd.description));
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logInteraction(LOG_LEVEL_ERROR, 'COMMANDS_JSON_INVALID', `Failed to load commands JSON: ${errorMessage}`, '');
            vscode.window.showErrorMessage(`Failed to load commands JSON: ${errorMessage}`);
            this.commands = [];
        }
    }

    getTreeItem(element: CommandItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        item.description = element.description;
        item.command = { command: 'copilot-automator.runCommand', title: 'Run Command', arguments: [element.label] };
        return item;
    }

    getChildren(): Thenable<CommandItem[]> {
        return Promise.resolve(this.commands);
    }
}