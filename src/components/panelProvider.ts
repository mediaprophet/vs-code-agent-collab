
import * as vscode from 'vscode';
import { AutomatorPanelBridge } from './automatorPanelBridge';

export class AutomatorPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'copilotAutomatorPanel';

    constructor(private readonly _extensionUri: vscode.Uri) {}


    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        webviewView.webview.options = { enableScripts: true, localResourceRoots: [this._extensionUri] };
        webviewView.webview.html = this.getHtmlForWebview();
        // Register this webview with the AutomatorPanelBridge singleton
        AutomatorPanelBridge.getInstance().setWebviewView(webviewView);
        webviewView.onDidDispose(() => {
            AutomatorPanelBridge.getInstance().clear();
        });
    }

    private getHtmlForWebview(): string {
        const fs = require('fs');
        const path = require('path');
        // Path to the HTML file in the extension
        const htmlPath = path.join(__dirname, '..', 'ui', 'automatorPanel.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Resolve the script path for the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'out', 'ui', 'automatorPanel.js');
        const scriptUri = (typeof this._extensionUri.with === 'function')
            ? this._extensionUri.with({ path: scriptPathOnDisk.path })
            : scriptPathOnDisk;
        // Replace script src with webview URI
        html = html.replace('src="automatorPanel.js"', `src="${scriptUri}"`);
        return html;
    }
}