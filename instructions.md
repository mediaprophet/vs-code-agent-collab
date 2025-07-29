# Copilot Automator Extension: Comprehensive Instructions

## Overview
Copilot Automator is a Visual Studio Code extension that enables advanced automation and collaboration with GitHub Copilot and local LLMs (such as LM Studio). It provides a modern UI, flexible file selection, automation scripting, and direct chat with your local model.

---

## Features
- **Automator Panel:** Main control panel for automation, logs, and command execution.
- **Chat with Local Model:** Sidebar panel for direct chat with your local LLM endpoint (e.g., LM Studio).
- **Flexible File Selection:** Select files for review using dialogs, glob patterns, or manual entry.
- **Settings Panel:** Configure LLM endpoints, models, temperature, and more.
- **Automation Scripting:** Run, validate, and create instruction files for complex automation.
- **History & Logs:** View all automation and chat history in a dedicated panel.
- **Model Selection:** Choose from available LLM endpoints and models.

---

## Installation
1. Clone or download this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run compile` to build the extension.
4. Launch the extension in VS Code (F5 for Extension Development Host, or package and install the `.vsix`).

---

## Getting Started
### 1. Open the Copilot Automator Activity Bar
- Click the **Copilot Automator** icon in the VS Code Activity Bar (left sidebar).
- You will see panels for Automator, Models, History, Commands, and **Chat with Local Model**.

### 2. Configure Settings
- Open the Command Palette (`Ctrl+Shift+P` or `F1`).
- Run `Copilot Automator: Open Settings Panel`.
- Set your LLM API URL (e.g., `http://localhost:1234/v1/chat/completions` for LM Studio), model, temperature, and other options.
- Save your settings.

### 3. Chat with Your Local Model
- In the Activity Bar, select **Chat with Local Model**.
- Type your prompt in the input box and press **Send**.
- The response from your local LLM will appear in the chat window.

### 4. Use Automation Features
- In the Automator Panel, you can:
  - Start, pause, resume, or stop agent cooperation.
  - Send prompts to Copilot Chat.
  - Accept Copilot suggestions.
  - View and manage automation history and logs.
  - Select files for review.
  - Manage specification resources.
  - Create and validate instruction files.
  - Run automation jobs from instruction files.

---

## Commands
All commands are available via the Command Palette (`Ctrl+Shift+P`):
- `Copilot Automator: Start Agent Cooperation`
- `Copilot Automator: Pause Agent Cooperation`
- `Copilot Automator: Resume Agent Cooperation`
- `Copilot Automator: Stop Agent Cooperation`
- `Copilot Automator: Open Settings Panel`
- `Copilot Automator: Select Files for LLM Review`
- `Copilot Automator: Manage Specification Resources`
- `Copilot Automator: Create Instruction Template`
- `Copilot Automator: Validate Instruction Files`
- `Copilot Automator: Run Instruction File`
- `Copilot Automator: View Logs`
- `Copilot Automator: Refresh LLM Models`
- `Copilot Automator: Select LLM Model`
- `Copilot Automator: Chat with Local Model`

---

## Panels & Views
- **Automator Panel:** Main automation controls and logs.
- **Available LLM Models:** List and select available models.
- **Automation History / Logs:** View all actions and chat history.
- **Available Commands:** Quick access to all extension commands.
- **Chat with Local Model:** Direct chat interface for your local LLM endpoint.

---

## Advanced Usage
### Automation Instruction Files
- Place `.json` instruction files in the `competition_json_files/` directory.
- Use the Automator Panel or commands to create, validate, and run these files.
- Instruction files can automate complex workflows, including file review, prompt chaining, and more.

### File Selection
- Use the file selection command to choose files for LLM review.
- Supports multi-select, glob patterns, and manual entry.

### Logs & History
- All actions, prompts, and responses are logged.
- View logs in the History panel or open the Log Viewer.

---

## Troubleshooting
- **Panel not visible?**
  - Make sure you have recompiled (`npm run compile`) and reloaded VS Code.
  - Check that your `package.json` includes the correct `views` and `activationEvents`.
- **No response from local model?**
  - Ensure your LLM endpoint (e.g., LM Studio) is running and accessible.
  - Verify the API URL in settings matches your LLM endpoint.
- **Extension not activating?**
  - Check the activation events in `package.json`.
  - Use the Command Palette to run any Copilot Automator command to trigger activation.

---

## Contributing
1. Fork the repository and create a new branch.
2. Make your changes and add tests if needed.
3. Run `npm run lint` and `npm run compile` to check for errors.
4. Submit a pull request with a clear description of your changes.

---

## License
See [LICENSE](LICENSE) for details.
