# Copilot Automator

A VS Code extension to automate and enhance interactions with GitHub Copilot and local LLMs, designed to be more functional, robust, and user-friendly than competing solutions (notably the Grok branch).

## Features
- **Smarter prompt management** with context and history
- **Flexible file selection**: multi-select, glob pattern, or manual entry
- **Multiple LLM endpoint support**: Copilot, OpenAI, Grok, local, etc.
- **Settings UI**: modern, accessible, and customizable
- **Automation scripting**: loops, branching, and conditionals
- **Advanced logging** and transparency
- **Prompt templates** and user customization
- **Dry run mode** for automation jobs
- **Token usage/cost feedback** (if available)
- **Test coverage** and developer documentation
- **Activity bar panel** and tree views for history, commands, and models
- **Session management**: pause, resume, and persistent state

## Getting Started

### Requirements
- VS Code v1.92.0 or later
- Node.js (for development)

### Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/mediaprophet/vs-code-agent-collab.git
   cd vs-code-agent-collab/copilot
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build the extension:
   ```sh
   npm run compile
   ```
4. Launch the extension in VS Code:
   - Press `F5` in VS Code to open a new Extension Development Host.

### Packaging for Marketplace
```
npm install -g @vscode/vsce
vsce package
```

## Usage
- Use the **Copilot Automator** activity bar to access the Automator Panel, history/logs, available commands, and LLM models.
- Start, pause, resume, or stop automation sessions from the panel.
- Select files for LLM review using multi-select, glob, or manual entry.
- Manage LLM endpoints and settings from the settings panel.
- View and filter logs, manage prompt history, and customize prompt templates.

## Configuration
- All settings are accessible via the Automator Panel or the command palette.
- LLM endpoints, models, and other options are configurable in the settings UI.
- Automation jobs and improvements are tracked in JSON files:
  - `copilot-automator-improvements.json`
  - `copilot-automator-jobs.json`
  - `copilot-automator-tasks.json`
  - `copilot-automator-updates.json`
  - `competition.json` (competition context and policy)

## Competitive Roadmap
- This branch is designed to surpass the Grok branch in features, usability, and robustness.
- See `competition.json` for the competitive policy and tracking files for progress.

## Development
- TypeScript, Node.js, and the latest VS Code API (@types/vscode)
- Modern UI with Tailwind CSS in webviews
- Modular, maintainable codebase
- Contributions and issues welcome!

## License
MIT

---

**Repository:** [Copilot Branch](https://github.com/mediaprophet/vs-code-agent-collab/tree/copilot)

**Competition:** [Grok Branch](https://github.com/mediaprophet/vs-code-agent-collab/tree/grok)
