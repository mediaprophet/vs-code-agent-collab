// agentCooperationGoal.ts
// Provides persistent, modular access to the agent cooperation goal as a JSON document.
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const AGENT_GOAL_FILENAME = 'agentCooperationGoal.json';

function getGoalFilePath(context: vscode.ExtensionContext): string {
    return path.join(context.globalStoragePath, AGENT_GOAL_FILENAME);
}

export async function setAgentCooperationGoal(context: vscode.ExtensionContext, goal: string): Promise<void> {
    const filePath = getGoalFilePath(context);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify({ goal }, null, 2), 'utf-8');
    await context.globalState.update('agentCooperationGoal', goal);
}

export async function getAgentCooperationGoal(context: vscode.ExtensionContext): Promise<string | undefined> {
    const filePath = getGoalFilePath(context);
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.goal;
    } catch {
        // Fallback to globalState if file does not exist
        return context.globalState.get('agentCooperationGoal', undefined);
    }
}

export async function clearAgentCooperationGoal(context: vscode.ExtensionContext): Promise<void> {
    const filePath = getGoalFilePath(context);
    try {
        await fs.promises.unlink(filePath);
    } catch {}
    await context.globalState.update('agentCooperationGoal', undefined);
}
