
import * as vscode from 'vscode';

/**
 * Represents a chat participant.
 */
export interface ChatParticipant {
  name: string;
  role?: string;
}

const PARTICIPANTS_KEY = 'chatParticipants';

/**
 * Gets all chat participants from global state.
 * @param context The extension context
 * @returns Array of chat participants
 */
export function getParticipants(context: vscode.ExtensionContext): ChatParticipant[] {
  return context.globalState.get<ChatParticipant[]>(PARTICIPANTS_KEY, []);
}

/**
 * Adds a chat participant to global state.
 * @param context The extension context
 * @param participant The participant to add
 */
export async function addParticipant(context: vscode.ExtensionContext, participant: ChatParticipant): Promise<void> {
  const participants = getParticipants(context);
  participants.push(participant);
  await context.globalState.update(PARTICIPANTS_KEY, participants);
}

/**
 * Removes a chat participant by index from global state.
 * @param context The extension context
 * @param idx The index of the participant to remove
 */
export async function removeParticipant(context: vscode.ExtensionContext, idx: number): Promise<void> {
  const participants = getParticipants(context);
  if (idx >= 0 && idx < participants.length) {
    participants.splice(idx, 1);
    await context.globalState.update(PARTICIPANTS_KEY, participants);
  }
}
