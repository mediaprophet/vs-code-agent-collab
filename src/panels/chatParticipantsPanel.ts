import { getParticipants, addParticipant, removeParticipant } from '../tools/chatparticipants';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function openChatParticipantsPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorChatParticipants',
        'Chat Participants',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const htmlPath = path.join(__dirname, '..', 'ui', 'chatParticipants.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');
    function sendParticipants() {
        const participants = getParticipants(context);
        panel.webview.postMessage({ command: 'participantsList', participants });
    }
    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'getParticipants') {
            sendParticipants();
        } else if (msg.command === 'addParticipant') {
            await addParticipant(context, { name: msg.name, role: msg.role });
            sendParticipants();
        } else if (msg.command === 'removeParticipant') {
            await removeParticipant(context, msg.idx);
            sendParticipants();
        }
    });
    sendParticipants();
}
