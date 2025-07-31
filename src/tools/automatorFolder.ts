import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

export const AUTOMATOR_FOLDER = '.automator';
export const AUTOMATOR_SETTINGS = 'settings.json';

export function getAutomatorFolderPath(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;
  return path.join(folders[0].uri.fsPath, AUTOMATOR_FOLDER);

}

export async function automatorFolderExists(): Promise<boolean> {
  const folderPath = getAutomatorFolderPath();
  if (!folderPath) return false;
  try {
    await fs.access(folderPath);
    return true;
  } catch {
    return false;
  }
}

export async function createAutomatorFolder(): Promise<boolean> {
  const folderPath = getAutomatorFolderPath();
  if (!folderPath) return false;
  try {
    await fs.mkdir(folderPath, { recursive: true });
    return true;
  } catch {
    return false;
  }
}


// Settings schema for extensibility
export interface AutomatorSettings {
  projectType?: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

export function validateSettings(settings: any): boolean {
  // Basic validation, extend as needed
  if (!settings || typeof settings !== 'object') return false;
  // Optionally check required fields
  return true;
}

export async function createAutomatorSettingsFile(defaults: AutomatorSettings = {}): Promise<boolean> {
  const folderPath = getAutomatorFolderPath();
  if (!folderPath) return false;
  const settingsPath = path.join(folderPath, AUTOMATOR_SETTINGS);
  try {
    await fs.access(settingsPath);
    // File exists, do not overwrite
    return true;
  } catch {
    await fs.writeFile(settingsPath, JSON.stringify(defaults, null, 2), 'utf8');
    return true;
  }
}


export async function getAutomatorSettings(): Promise<AutomatorSettings | undefined> {
  const folderPath = getAutomatorFolderPath();
  if (!folderPath) return undefined;
  const settingsPath = path.join(folderPath, AUTOMATOR_SETTINGS);
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);
    return validateSettings(settings) ? settings : undefined;
  } catch {
    return undefined;
  }
}

// Extensibility: helper to add a resource file to .automator
export async function addAutomatorResourceFile(filename: string, content: string | Buffer): Promise<boolean> {
  const folderPath = getAutomatorFolderPath();
  if (!folderPath) return false;
  const filePath = path.join(folderPath, filename);
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch {
    return false;
  }
}
