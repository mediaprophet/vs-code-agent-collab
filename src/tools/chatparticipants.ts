import * as vscode from 'vscode';

export interface ChatParticipant {
  name: string;
  role?: string;
}

const PARTICIPANTS_KEY = 'chatParticipants';

export function getParticipants(context: vscode.ExtensionContext): ChatParticipant[] {
  return context.globalState.get<ChatParticipant[]>(PARTICIPANTS_KEY, []);
}

export async function addParticipant(context: vscode.ExtensionContext, participant: ChatParticipant) {
  const participants = getParticipants(context);
  participants.push(participant);
  await context.globalState.update(PARTICIPANTS_KEY, participants);
}

export async function removeParticipant(context: vscode.ExtensionContext, idx: number) {
  const participants = getParticipants(context);
  if (idx >= 0 && idx < participants.length) {
    participants.splice(idx, 1);
    await context.globalState.update(PARTICIPANTS_KEY, participants);
  }
}
