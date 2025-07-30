
# Copilot Automator Extension: Comprehensive Instructions (2025)


## Overview
Copilot Automator is a powerful Visual Studio Code extension for advanced agent cooperation, automation, and collaboration with GitHub Copilot and local LLMs (e.g., LM Studio, Ollama). It features a modern UI, persistent state, flexible file selection, automation scripting, direct chat with your local model, and robust logging/history. The extension is modular, extensible, and designed for both end-users and contributors.

---


## Key Features
- **Automator Panel:** Main control panel for automation, logs, and command execution. Start, pause, resume, or stop agent cooperation. View and manage automation history, logs, and tasks.
- **Chat with Local Model:** Sidebar panel for direct chat with your local LLM endpoint (e.g., LM Studio, Ollama). Supports streaming responses, loading indicators, and clearing chat history.
- **Flexible File Selection:** Select files for review using dialogs, glob patterns, or manual entry. Supports multi-select and filtering.
- **Settings Panel:** Configure LLM endpoints, models, temperature, and more. Supports multiple endpoints and dynamic switching.
- **Automation Scripting:** Run, validate, and create instruction files for complex automation. Supports step execution and template creation.
- **History & Logs:** View all automation and chat history in a dedicated panel. Filter/search, export, and import logs.
- **Model Selection:** Choose from available LLM endpoints and models. Load/unload models, view memory info, and use context menu actions.
- **Available Commands:** Tree view of all extension commands, with grouping/filtering and error handling.
- **UI Text Area Mapping:** Map input/output areas for Copilot chat and other UI elements. Import/export and manage mappings.

---


## Installation
1. Clone or download this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run compile` to build the extension.
4. Launch the extension in VS Code (F5 for Extension Development Host, or package and install the `.vsix` file).
5. Ensure your local LLM endpoint (e.g., LM Studio) is running if you want to use local model features.

---


## Getting Started
### 1. Open the Copilot Automator Activity Bar
- Click the **Copilot Automator** icon in the VS Code Activity Bar (left sidebar).
- Panels available: Automator, Models, History, Commands, Chat with Local Model, and Settings.

### 2. Configure Settings
- Open the Command Palette (`Ctrl+Shift+P` or `F1`).
- Run `Copilot Automator: Open Settings Panel`.
- Set your LLM API URL (e.g., `http://localhost:1234/v1/chat/completions` for LM Studio), model, temperature, and other options.
- Save your settings. You can switch endpoints and models at any time.

### 3. Chat with Your Local Model
- In the Activity Bar, select **Chat with Local Model**.
- Type your prompt in the input box and press **Send**.
- The response from your local LLM will appear in the chat window, streaming in real time. Use the **Clear** button to reset the chat.

### 4. Use Automation Features
- In the Automator Panel, you can:
  - Start, pause, resume, or stop agent cooperation.
  - View and manage the agent's goal and task list.
  - Send prompts to Copilot Chat or your local LLM.
  - Accept Copilot suggestions.
  - View and manage automation history and logs (with filtering, export, and import).
  - Select files for review (multi-select, glob, manual entry).
  - Manage specification resources.
  - Create, validate, and run instruction files for automation.

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
- `Copilot Automator: Export/Import History`
- `Copilot Automator: Export/Import UI Mappings`

---


## Panels & Views
- **Automator Panel:** Main automation controls, agent goal/task list, and logs.
- **Available LLM Models:** List, load/unload, and select available models. View memory info and use context menu actions.
- **Automation History / Logs:** View all actions and chat history. Filter/search, export, and import logs.
- **Available Commands:** Quick access to all extension commands, with grouping/filtering.
- **Chat with Local Model:** Direct chat interface for your local LLM endpoint. Streaming, loading indicators, clear chat.
- **Settings Panel:** Configure endpoints, models, and parameters.
- **UI Text Area Mapping:** Manage, import/export, and suggest mappings for Copilot and LLM chat areas.

---


## Advanced Usage
### Automation Instruction Files
- Place `.json` instruction files in the appropriate directory (e.g., `Grok_Competition_Files/`).
- Use the Automator Panel or commands to create, validate, and run these files.
- Instruction files can automate complex workflows, including file review, prompt chaining, and more. Step execution and validation are supported.

### File Selection
- Use the file selection command to choose files for LLM review.
- Supports multi-select, glob patterns, and manual entry. Filtering and grouping are available.

### Logs & History
- All actions, prompts, and responses are logged.
- View logs in the History panel or open the Log Viewer.
- Use export/import features to back up or restore logs.

### UI Text Area Mapping
- Map input/output areas for Copilot chat and other UI elements.
- Import/export mappings as JSON. Manage and suggest mappings from the Settings or Mapping panel.

---


## Troubleshooting & Tips
- **Panel not visible?**
  - Recompile (`npm run compile`) and reload VS Code.
  - Check that your `package.json` includes the correct `views` and `activationEvents`.
- **No response from local model?**
  - Ensure your LLM endpoint (e.g., LM Studio) is running and accessible.
  - Verify the API URL in settings matches your LLM endpoint.
- **Extension not activating?**
  - Check the activation events in `package.json`.
  - Use the Command Palette to run any Copilot Automator command to trigger activation.
- **Model/endpoint errors?**
  - Check logs in the History panel for error messages.
  - Use the Settings panel to switch endpoints or models.
- **Export/import not working?**
  - Ensure you have file system permissions for the target directory.
  - Check for malformed JSON files when importing.

---


## Contributing
1. Fork the repository and create a new branch.
2. Make your changes and add tests if needed (unit/integration tests recommended for new features).
3. Run `npm run lint` and `npm run compile` to check for errors.
4. Submit a pull request with a clear description of your changes and reference any related issues or recommendations.

---


## License
See [LICENSE](LICENSE) for details.
