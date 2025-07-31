
import * as vscode from 'vscode';
import { logInteraction, LOG_LEVEL_ERROR } from './history';


/**
 * Represents a command item for the CommandsProvider tree view.
 */
export class CommandItem {
    constructor(
        public readonly label: string,
        public readonly description?: string
    ) {}
}


/**
 * Provides a tree view of available commands for the Automator extension.
 */
export class CommandsProvider implements vscode.TreeDataProvider<CommandItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandItem | undefined | void> = new vscode.EventEmitter<CommandItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<CommandItem | undefined | void> = this._onDidChangeTreeData.event;
    private commands: CommandItem[] = [];

    /**
     * Initializes the provider with a JSON object containing commands.
     * @param commandsJson The JSON object with a 'commands' array
     */
    constructor(commandsJson: unknown) {
        try {
            const cmds = (commandsJson as { commands?: { command: string; description?: string }[] })?.commands || [];
            this.commands = cmds.map(cmd => new CommandItem(cmd.command, cmd.description));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logInteraction(LOG_LEVEL_ERROR, 'COMMANDS_JSON_INVALID', `Failed to load commands JSON: ${errorMessage}`, '');
            vscode.window.showErrorMessage(`Failed to load commands JSON: ${errorMessage}`);
            this.commands = [];
        }
    }

    /**
     * Returns a tree item for the given command.
     * @param element The command item
     */
    getTreeItem(element: CommandItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        item.description = element.description;
        item.command = { command: 'copilot-automator.runCommand', title: 'Run Command', arguments: [element.label] };
        return item;
    }

    /**
     * Returns the list of command items for the tree view.
     */
    getChildren(): Thenable<CommandItem[]> {
        return Promise.resolve(this.commands);
    }
}