import { loadMindMapOntology, saveMindMapOntology } from '../tools/mindmapOntology';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function openMindMapOntologyPanel() {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorMindMapOntology',
        'MindMap Ontology Workspace',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const htmlPath = path.join(__dirname, '..', 'ui', 'semweb', 'mindmap', 'mindMapOntology.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'saveMindMap') {
            await saveMindMapOntology(msg.mindMap);
            panel.webview.postMessage({ command: 'mindMapSaved' });
        } else if (msg.command === 'loadMindMap') {
            const mindMap = await loadMindMapOntology();
            panel.webview.postMessage({ command: 'mindMapData', mindMap });
        }
    });
}
