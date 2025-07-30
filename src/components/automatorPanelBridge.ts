// AutomatorPanelBridge: Handles communication between extension backend and Automator panel webview
import * as vscode from 'vscode';

export class AutomatorPanelBridge {
    private static _instance: AutomatorPanelBridge;
    private _webviewView: vscode.WebviewView | undefined;

    private constructor() {}

    public static getInstance(): AutomatorPanelBridge {
        if (!AutomatorPanelBridge._instance) {
            AutomatorPanelBridge._instance = new AutomatorPanelBridge();
        }
        return AutomatorPanelBridge._instance;
    }

    public setWebviewView(webviewView: vscode.WebviewView) {
        this._webviewView = webviewView;
    }

    public sendDialogue(text: string) {
        if (this._webviewView) {
            this._webviewView.webview.postMessage({ type: 'dialogue', text });
        }
    }

    public clear() {
        this._webviewView = undefined;
    }
}
