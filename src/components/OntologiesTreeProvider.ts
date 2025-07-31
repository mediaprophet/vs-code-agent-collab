
// OntologiesTreeProvider.ts
// VS Code TreeDataProvider for listing ontologies in the project

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getAutomatorFolderPath } from '../tools/automatorFolder';

/**
 * Provides a tree view of ontology files in the .automator/ontologies directory.
 */
export class OntologiesTreeProvider implements vscode.TreeDataProvider<OntologyTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<OntologyTreeItem | undefined | void> = new vscode.EventEmitter<OntologyTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<OntologyTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  /**
   * Refreshes the tree data view.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Gets the children (ontology files) for the tree view.
   * @param element The parent element (unused; only root supported)
   * @returns Promise of ontology tree items
   */
  async getChildren(element?: OntologyTreeItem): Promise<OntologyTreeItem[]> {
    if (element) {
      // No children for leaf nodes
      return [];
    }
    // List ontology files in .automator/ontologies
    const automatorPath = getAutomatorFolderPath();
    if (!automatorPath) return [];
    const ontologiesDir = path.join(automatorPath, 'ontologies');
    try {
      const files = await fs.readdir(ontologiesDir);
      return files.filter(f => f.endsWith('.json') || f.endsWith('.ttl') || f.endsWith('.rdf') || f.endsWith('.owl'))
        .map(f => new OntologyTreeItem(f, path.join(ontologiesDir, f)));
    } catch (err) {
      // Optionally log error or notify user
      return [];
    }
  }

  /**
   * Gets the tree item for the given ontology file.
   * @param element The ontology tree item
   * @returns The tree item for the view
   */
  getTreeItem(element: OntologyTreeItem): vscode.TreeItem {
    return element;
  }
}

/**
 * Represents a tree item for an ontology file.
 */
export class OntologyTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly filePath: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = filePath;
    this.description = path.extname(filePath).replace('.', '').toUpperCase();
    this.resourceUri = vscode.Uri.file(filePath);
    this.iconPath = new vscode.ThemeIcon('symbol-structure');
    this.command = {
      command: 'vscode.open',
      title: 'Open Ontology',
      arguments: [this.resourceUri]
    };
  }
}
