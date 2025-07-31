import { getMappings, addMapping, removeMapping } from '../tools/mapping';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function openMappingPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorMappingPanel',
        'UI Text Area Mappings',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const htmlPath = path.join(__dirname, '..', 'ui', 'mappingPanel.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');
    function sendMappings() {
        const mappings = getMappings(context);
        panel.webview.postMessage({ command: 'mappingsList', mappings });
    }
    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'getMappings') {
            sendMappings();
        } else if (msg.command === 'addMapping') {
            const id = Date.now().toString();
            await addMapping(context, { id, source: msg.source, target: msg.target, description: msg.description });
            sendMappings();
        } else if (msg.command === 'removeMapping') {
            await removeMapping(context, msg.id);
            sendMappings();
        }
    });
    sendMappings();
}
