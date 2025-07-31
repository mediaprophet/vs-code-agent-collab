# Automator Folder Creation: Feature Plan

## Overview
This feature provides a user-friendly way to create the `.automator/` folder in a VS Code workspace if it does not exist. It offers multiple entry points: a button for quick creation, a form for project type selection, and an agent-driven flow for descriptive project setup. The folder will be initialized with a settings file and can be extended with additional resources as needed.

---

## Goals
- Detect if `.automator/` folder is missing when the extension activates.
- Offer a UI (button or form) to create the folder.
- Allow manual creation or guided setup (form/agent).
- Initialize folder with a settings file (e.g., `settings.json`).
- Support extensibility for future resources (frameworks, ontologies, templates, etc).

---

## User Experience
1. **Detection**
   - On activation, check for `.automator/` in the workspace root.
   - If missing, show a notification or panel with options.

2. **Quick Create Button**
   - Button: "Create .automator Folder"
   - On click: creates the folder and a default `settings.json`.

3. **Project Type Form**
   - Form fields: Project type (dropdown), name, description, etc.
   - On submit: creates folder, settings file, and preps structure for selected type.

4. **Agent-Driven Setup**
   - Text area: "Describe your project"
   - Agent parses description, suggests structure/resources, and confirms with user.
   - On approval: creates folder, settings, and any recommended files.

5. **Feedback**
   - Success/failure messages for all actions.
   - Option to open the folder or settings file after creation.

---

## Implementation Plan
1. **Backend**
   - Add a function to check for `.automator/` on activation.
   - Add commands to create the folder and settings file.
   - Add logic to handle form/agent input and generate resources.

2. **UI**
   - Create a webview panel (`src/ui/automatorFolder.html`) for the creation flow.
   - Show options: quick button, form, agent input.
   - Display feedback and next steps.

3. **Agent Integration**
   - Use LLM or prompt-based agent to parse user project descriptions.
   - Suggest folder structure and resources.
   - Confirm with user before creation.

4. **Settings File**
   - Define a minimal `settings.json` schema (project type, name, description, etc).
   - Allow for future extensibility.

5. **Extensibility**
   - Plan for adding frameworks, ontologies, templates, etc, after folder creation.

---

## Enhancements & Future Features
- Add templates for common project types.
- Integrate with framework/ontology management.
- Allow importing/exporting `.automator/` configs.
- Add validation and error handling for all flows.
- Support multi-root workspaces.
- Telemetry (opt-in) for feature usage.

---

## Related Files/Components
- `src/ui/automatorFolder.html` (UI panel)
- `src/tools/automatorFolder.ts` (backend logic)
- `src/tools/agentProjectSetup.ts` (agent-driven setup)
- `src/tools/settingsSchema.ts` (settings file schema/validation)
- Extension activation logic (detection)

---

## Acceptance Criteria
- User is prompted if `.automator/` is missing.
- User can create the folder via button, form, or agent.
- Folder is initialized with a valid settings file.
- User receives clear feedback and next steps.
- Code is modular and extensible for future enhancements.
