import { addOntology, readNamespaces, writeNamespaces, readMappings, writeMappings, readSparqlHistory, writeSparqlHistory } from '../tools/semanticWeb';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function openSemWebPanel() {
    const panel = vscode.window.createWebviewPanel(
        'copilotAutomatorSemWeb',
        'Semantic Web Tools',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    const htmlPath = path.join(__dirname, '..', 'ui', 'semweb', 'index.html');
    panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

    panel.webview.onDidReceiveMessage(async (msg: any) => {
        if (msg.command === 'getNamespaces') {
            const namespaces = await readNamespaces();
            panel.webview.postMessage({ command: 'namespaces', namespaces });
        } else if (msg.command === 'addNamespace') {
            const namespaces = await readNamespaces();
            namespaces.push({ prefix: msg.prefix, uri: msg.uri });
            await writeNamespaces(namespaces);
            panel.webview.postMessage({ command: 'namespaces', namespaces });
        } else if (msg.command === 'removeNamespace') {
            const namespaces = await readNamespaces();
            namespaces.splice(msg.index, 1);
            await writeNamespaces(namespaces);
            panel.webview.postMessage({ command: 'namespaces', namespaces });
        } else if (msg.command === 'getMappings') {
            const mappings = await readMappings();
            panel.webview.postMessage({ command: 'mappings', mappings });
        } else if (msg.command === 'addMapping') {
            const mappings = await readMappings();
            mappings.push(msg.mapping);
            await writeMappings(mappings);
            panel.webview.postMessage({ command: 'mappings', mappings });
        } else if (msg.command === 'removeMapping') {
            const mappings = await readMappings();
            mappings.splice(msg.index, 1);
            await writeMappings(mappings);
            panel.webview.postMessage({ command: 'mappings', mappings });
        } else if (msg.command === 'getSparqlHistory') {
            const history = await readSparqlHistory();
            panel.webview.postMessage({ command: 'sparqlHistory', history });
        } else if (msg.command === 'addSparqlHistory') {
            const history = await readSparqlHistory();
            history.push(msg.entry);
            await writeSparqlHistory(history);
            panel.webview.postMessage({ command: 'sparqlHistory', history });
        } else if (msg.command === 'runSparql') {
            panel.webview.postMessage({ command: 'sparqlResult', result: 'SPARQL execution not yet implemented.' });
        } else if (msg.command === 'addOntology') {
            const { original, rdfjson } = await addOntology(msg.filename, msg.content, msg.format);
            panel.webview.postMessage({ command: 'ontologyAdded', original, rdfjson });
        }
    });
}
