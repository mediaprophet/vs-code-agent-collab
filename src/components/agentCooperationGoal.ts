
// agentCooperationGoal.ts
// Provides persistent, modular access to the agent cooperation goal as a JSON document.
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const AGENT_GOAL_FILENAME = 'agentCooperationGoal.json';

/**
 * Gets the file path for the agent cooperation goal JSON file.
 * @param context The extension context
 * @returns The file path as a string
 */
function getGoalFilePath(context: vscode.ExtensionContext): string {
    return path.join(context.globalStoragePath, AGENT_GOAL_FILENAME);
}

/**
 * Sets the agent cooperation goal and persists it to disk and global state.
 * @param context The extension context
 * @param goal The goal string
 */
export async function setAgentCooperationGoal(context: vscode.ExtensionContext, goal: string): Promise<void> {
    const filePath = getGoalFilePath(context);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify({ goal }, null, 2), 'utf-8');
    await context.globalState.update('agentCooperationGoal', goal);
}

/**
 * Gets the agent cooperation goal from disk or global state.
 * @param context The extension context
 * @returns The goal string, or undefined if not set
 */
export async function getAgentCooperationGoal(context: vscode.ExtensionContext): Promise<string | undefined> {
    const filePath = getGoalFilePath(context);
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.goal;
    } catch (err) {
        // Fallback to globalState if file does not exist or parse fails
        return context.globalState.get('agentCooperationGoal', undefined);
    }
}

/**
 * Clears the agent cooperation goal from disk and global state.
 * @param context The extension context
 */
export async function clearAgentCooperationGoal(context: vscode.ExtensionContext): Promise<void> {
    const filePath = getGoalFilePath(context);
    try {
        await fs.promises.unlink(filePath);
    } catch {
        // Ignore file not found or unlink errors
    }
    await context.globalState.update('agentCooperationGoal', undefined);
}
