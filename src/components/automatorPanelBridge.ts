
// AutomatorPanelBridge: Handles communication between extension backend and Automator panel webview
import * as vscode from 'vscode';

/**
 * Singleton bridge for communication between the extension backend and the Automator panel webview.
 */
export class AutomatorPanelBridge {
    private static _instance: AutomatorPanelBridge;
    private _webviewView: vscode.WebviewView | undefined;

    private constructor() {}

    /**
     * Gets the singleton instance of AutomatorPanelBridge.
     */
    public static getInstance(): AutomatorPanelBridge {
        if (!AutomatorPanelBridge._instance) {
            AutomatorPanelBridge._instance = new AutomatorPanelBridge();
        }
        return AutomatorPanelBridge._instance;
    }

    /**
     * Sets the webview view for communication.
     * @param webviewView The webview view instance
     */
    public setWebviewView(webviewView: vscode.WebviewView): void {
        this._webviewView = webviewView;
    }

    /**
     * Sends a dialogue message to the webview, if available.
     * @param text The message text
     */
    public sendDialogue(text: string): void {
        if (this._webviewView) {
            try {
                this._webviewView.webview.postMessage({ type: 'dialogue', text });
            } catch (err) {
                // Optionally log or notify user
            }
        }
    }

    /**
     * Clears the webview reference.
     */
    public clear(): void {
        this._webviewView = undefined;
    }
}
