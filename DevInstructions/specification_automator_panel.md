# Copilot Automator Panel Specification

This document describes the intended functionality, user experience, and integration points for the Copilot Automator Panel (AutomatorPanelProvider) in the VS Code extension.

## Overview
The Automator Panel provides a user interface for controlling, monitoring, and interacting with the Copilot Automator extension. It is implemented as a VS Code Webview View and is accessible from the extension's activity bar.

## Functional Requirements

### 1. Quick Actions (Automation Controls)
- **Map UI Area**: Initiates the process to map a UI text area for automation. Should trigger the extension command to start mapping and provide user feedback in the dialogue log.
- **Manage UI Mappings**: Opens a management interface for existing UI mappings. Should allow users to view, edit, or remove mappings.
- **Export Mappings**: Exports current UI mappings to a file. Should provide success/failure feedback.
- **Import Mappings**: Imports UI mappings from a file. Should provide success/failure feedback.
- **Suggest Chat Mappings**: Triggers auto-detection of Copilot Chat UI areas. Should display suggestions and allow user confirmation.
- **Go / Start**: Starts the agent cooperation/automation process. Should prompt for a goal and display status in the dialogue log.
- **Pause**: Pauses the agent cooperation process. Should update status in the dialogue log.
- **Resume**: Resumes a paused agent cooperation process. Should update status in the dialogue log.
- **Stop**: Stops the agent cooperation process. Should update status in the dialogue log.
- **Settings**: Opens the settings panel for LLM and extension configuration.
- **Select Files**: Opens a file picker for selecting files to review with the LLM.
- **Spec Resources**: Opens a panel to manage specification resource URLs.
- **Run Instruction**: Runs an automation instruction file. Should display progress and results in the dialogue log.
- **View Logs**: Opens the log viewer panel.

### 2. Dialogue Log
- **Display User Actions**: All user actions (button clicks, commands) should be logged in the dialogue area.
- **Display Automation/LLM Output**: All output from automation steps, LLM responses, and system messages should be displayed in the dialogue area, with clear distinction between user and system/LLM messages.
- **Live Updates**: The dialogue log should update in real time as new messages are received from the extension backend.
- **Accessibility**: The dialogue log should be accessible, with appropriate ARIA attributes and keyboard navigation.

### 3. Command Input
- **Send Command**: Users can type a command (e.g., `sendPrompt`) and submit it. The command is sent to the extension backend, and the result/output is displayed in the dialogue log.
- **Input Validation**: Invalid or unrecognized commands should result in a clear error message in the dialogue log.

## Integration Points
- The panel communicates with the extension backend via `vscode.postMessage` (from webview to extension) and `webviewView.webview.postMessage` (from extension to webview).
- The extension backend should provide a helper to send output/messages to the panel (e.g., `sendToAutomatorPanel(text)`), and use it for all automation/LLM/system output.
- The panel should listen for messages of type `{ type: 'dialogue', text: string }` and append them to the dialogue log.

## User Experience
- All actions should provide immediate visual feedback in the dialogue log.
- Errors and warnings should be clearly distinguished from normal output.
- The UI should be responsive, accessible, and visually consistent with VS Code themes.

## Extensibility
- The panel should be designed to support future features, such as:
  - Filtering/searching the dialogue log
  - Richer message formatting (markdown, code blocks)
  - Contextual help/tooltips for commands and actions

## Security & Privacy
- All user input should be sanitized before rendering in the webview.
- No sensitive data should be logged or displayed without user consent.

---
This specification should be used as the basis for implementing, testing, and extending the Copilot Automator Panel functionality.
