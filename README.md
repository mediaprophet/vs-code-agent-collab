# Copilot Automator VS Code Extension - Grok Edition

## Overview
Copilot Automator is a Visual Studio Code extension that leverages a local Large Language Model (LLM) such as Ollama or LM Studio to automate prompt generation and manage workflows in collaboration with GitHub Copilot agents. It enables seamless agent cooperation, where the local LLM generates context-aware prompts based on editor content, workspace files, and specification resources, while providing user controls for approval and execution. This extension enhances productivity by automating repetitive coding tasks, reviewing files, and handling sensitive actions like 'run' commands with user verification.

## Features
- **Agent Cooperation**: Iterative process where the local LLM generates prompts for Copilot, incorporating editor context, file reviews, and specification resources.
- **LLM Model Management**: Tree view to select and refresh available LLM models from the local API.
- **File Review**: Automatically reviews workspace files based on patterns or manual selection, including JSON specifications in an `instructions` folder.
- **Specification Resources**: UI to manage and fetch content from URLs for additional context during prompt generation.
- **Prompt Approval**: User approval for sending prompts to Copilot, with extra checks for sensitive actions (e.g., 'run').
- **History and Logs**: Tree view for cooperation history and detailed logging of interactions.
- **Available Commands**: Tree view of commands from `copilot-automator-commands.json`.
- **Settings Panel**: Configure LLM API URL, model, temperature, max prompts per session, context source, file review paths, and specification URLs.
- **Error Handling**: Robust validation for JSON files, workspace path restrictions, URL sanitization, and user-friendly error messages.

## Installation
1. **Prerequisites**:
   - VS Code version 1.80.0 or higher.
   - A local LLM server (e.g., Ollama or LM Studio) running with endpoints `/v1/chat/completions` and `/v1/models`.
   - GitHub Copilot extension installed and enabled for chat interactions.

2. **Install from VS Code Marketplace**:
   - Search for "Copilot Automator" in the VS Code Extensions view (Ctrl+Shift+X) and install.

3. **Install from VSIX**:
   - Download the `.vsix` file from the [releases page](https://github.com/your-repo/copilot-automator/releases).

## Project Folders

- `.automator/`: Contains all agent support files, logs, available commands, and project/job/task tracking files for agent-driven automation.
   - In VS Code, go to Extensions view, click the "..." menu, and select "Install from VSIX...".

## Usage
1. **Configure Settings**:
   - Open the settings panel via the Activity Bar or command `Copilot Automator: Open Settings Panel`.
   - Set your LLM API URL (e.g., `http://localhost:1234/v1/chat/completions`), model, temperature, and other options.
   - Specify file review paths (e.g., `src/*.ts`) and specification resource URLs.

2. **Start Agent Cooperation**:
   - Click "Go" in the Activity Bar panel or run the command `Start Agent Cooperation`.
   - Enter your cooperation goal (e.g., "Implement a sorting function in TypeScript").
   - The extension will generate prompts, seek approval, and interact with Copilot.

3. **File Review**:
   - Select files via "Select Files for Review" in the Activity Bar or command `Copilot Automator: Select Files for LLM Review`.
   - The LLM will review selected files, patterns from settings, and JSON specs in the `instructions` folder.

4. **Specification Resources**:
   - Manage URLs via "Spec Resources" in the Activity Bar or command `Copilot Automator: Manage Specification Resources`.
   - Content from these URLs is fetched and included in LLM context for prompt generation.

5. **History and Commands**:
   - View cooperation history and logs in the "Automation History / Logs" tree view.
   - Browse and run available commands in the "Available Commands" tree view.

6. **Stop Cooperation**:
   - Click "Stop" in the Activity Bar panel or run the command `Stop Agent Cooperation`.

## Configuration
The extension uses VS Code's global state for persistent settings. Default values:
- `llmApiUrl`: `http://localhost:1234/v1/chat/completions`
- `llmModel`: `your-model-name`
- `llmTemp`: 0.7
- `maxPrompts`: 10
- `contextSource`: `editor`
- `fileReviewPaths`: ''
- `specResourceUrls`: ''

Update these via the settings panel.

## Development
- **Clone the Repository**: `git clone https://github.com/your-repo/copilot-automator.git`
- **Install Dependencies**: `npm install`
- **Compile**: `npm run compile`
- **Run in VS Code**: Press F5 to launch a new VS Code instance with the extension loaded.

### Dependencies
- `axios`: For LLM and URL requests.
- `glob`: For file pattern matching.

### Scripts
- `npm run compile`: Build the extension.
- `npm run watch`: Watch for changes and rebuild.
- `npm run lint`: Lint the code.
- `npm run test`: Run tests (if implemented).

## Contributing
Contributions are welcome! Please submit issues or pull requests on GitHub. Follow the code style and add tests for new features.

## License
MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments
- Built with inspiration from GitHub Copilot and local LLM tools like Ollama and LM Studio.
- Thanks to the VS Code extension community for API references and best practices.

</xaiArtifact>