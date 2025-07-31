# Framework Integration Instructions

## Overview
This document describes the steps and requirements to update the project so users can add specific frameworks as part of their project development instructions.

---

## Instructions

### 1. UI/UX
- Add a form or selection component in the project setup or instruction UI (e.g., in a webview) to allow users to select or specify frameworks (e.g., React, Express, Django, FastAPI, etc.).
- Allow users to add multiple frameworks and specify versions if needed.
- Display a list of selected frameworks as part of the project summary or instructions.

### 2. Backend/Extension Logic
- Update the extension backend to receive and store the selected frameworks as part of the project or instruction data.
- Validate framework names and versions (optionally suggest or autocomplete popular frameworks).
- When generating project instructions or scaffolding, include the selected frameworks in the output.

### 3. Project Scaffolding/Automation
- If the extension supports project scaffolding, update the logic to:
  - Install the selected frameworks using the appropriate package manager (npm, pip, etc.).
  - Add configuration files or boilerplate code for the frameworks.
  - Document the frameworks and their versions in the project README or metadata.



### 4.1. Specification Requirements for Framework Resources

- For each framework or project type, users should be able to define:
  - **Required Packages/Dependencies:** List of npm, pip, pub, or other package manager dependencies (with versions).
  - **APIs/SDKs:** Any APIs or SDKs that must be referenced or configured (e.g., VS Code API, Obsidian API, Solid API, Expo SDK, Flutter SDK).
  - **Configuration Files:** Any required config files (e.g., `package.json`, `manifest.json`, `pubspec.yaml`, `respec-config.js`).
  - **Boilerplate/Starter Code:** Templates or starter files for the framework (e.g., extension entry point, plugin main file, app entry, documentation template).
  - **Documentation Links:** URLs to official docs for each framework or API.
  - **Platform Targets:** For cross-platform projects, specify target platforms (e.g., iOS, Android, Web, WatchOS, Wear OS).
  - **Build/Run Scripts:** Any scripts or commands needed to build, run, or test the project.
  - **Custom Instructions:** Any additional setup or integration steps unique to the framework or project type.

#### Example Resource Definition (JSON)

```json
{
  "framework": "React Native",
  "version": "0.74.x",
  "packages": ["react-native", "expo"],
  "apis": ["Expo SDK 50"],
  "configFiles": ["app.json", "package.json"],
  "boilerplate": "App.js template",
  "docs": ["https://reactnative.dev/docs/getting-started", "https://docs.expo.dev/"],
  "platforms": ["iOS", "Android"],
  "scripts": ["npm start", "expo build"],
  "customInstructions": "Configure Expo for both iOS and Android."
}
```

---

- **VS Code Extension**
  - "Create a VS Code extension using the VS Code Extension API and TypeScript. Add support for the `vscode` and `@types/vscode` frameworks."
  - The extension should scaffold the project, install dependencies, and set up the extension manifest.

- **Obsidian Extension**
  - "Create an Obsidian plugin using the Obsidian API and TypeScript. Add support for the `obsidian` and `@types/obsidian` frameworks."
  - The extension should scaffold the plugin, install dependencies, and set up the manifest and entry point.

- **W3C Solid App**
  - "Create a W3C Solid app using the `solid-client`, `solid-auth-client`, and `lit-html` frameworks."
  - The extension should scaffold the app, install dependencies, and set up configuration for Solid authentication and data access.

- **Mobile App (iOS and Android)**
  - "Create a cross-platform mobile app using React Native (0.74.x) and Expo (SDK 50). Add support for both iOS and Android."
  - The extension should scaffold the app, install dependencies, and configure platform-specific settings for iOS and Android.

- **Watch App**
  - "Create a smartwatch app using Flutter (3.x) and Wear OS/WatchOS SDKs."
  - The extension should scaffold the app, install dependencies, and set up the project for the selected watch platform(s).

- **ReSpec Documentation**
  - "Generate technical documentation using the ReSpec framework."
  - The extension should scaffold a documentation project, add ReSpec as a dependency, and provide a template for W3C-style specifications.

- **General Example**
  - "Add the following frameworks to the project: React (18.x), Express (4.x), and Tailwind CSS (3.x)."
  - The extension should parse this instruction, update the project setup, and automate installation/configuration as needed.

### 5. Extensibility
- Make it easy to add support for new frameworks in the future (e.g., by updating a config file or registry).
- Document the process for adding new frameworks to the extension.

---

## Notes
- Consider using existing package manager APIs (npm, pip, etc.) for installation.
- Ensure clear error handling and user feedback for unsupported or invalid frameworks.
- Provide links to official documentation for each supported framework.

---

## To-Do List for Framework Integration

1. **UI/UX**
  - [ ] Design and implement a webview form for selecting/adding frameworks and versions.
  - [ ] Allow users to add, remove, and view selected frameworks in the UI.
  - [ ] Display framework details, documentation links, and configuration hints.

2. **Backend/Extension Logic**
  - [ ] Implement storage and retrieval of selected frameworks as part of project/instruction data.
  - [ ] Validate framework names and versions (with autocomplete/suggestions).
  - [ ] Parse user instructions to extract framework requirements.
  - [ ] Support loading framework definitions from `.automator/frameworks/`.

3. **Project Scaffolding/Automation**
  - [ ] Automate installation of selected frameworks using the correct package manager (npm, pip, pub, etc.).
  - [ ] Generate and update configuration files (e.g., `package.json`, `manifest.json`, etc.).
  - [ ] Add boilerplate/starter code for each framework as needed.
  - [ ] Document frameworks and versions in the project README or metadata.

4. **Specification & Extensibility**
  - [ ] Define a JSON schema for framework resource definitions.
  - [ ] Document the process for adding new frameworks to the extension.
  - [ ] Provide example resource definitions for common frameworks (React, Django, Flutter, etc.).

5. **Examples & Testing**
  - [ ] Implement example flows for VS Code extension, Obsidian plugin, Solid app, mobile app, watch app, and ReSpec documentation.
  - [ ] Test framework integration for each example and validate generated projects.

6. **Error Handling & Feedback**
  - [ ] Provide clear error messages for unsupported/invalid frameworks or versions.
  - [ ] Guide users to official documentation for troubleshooting.

7. **Advanced Features (Optional)**
  - [ ] Support custom scripts or post-install hooks for frameworks.
  - [ ] Allow users to save and share framework presets or templates.
  - [ ] Integrate with online registries for framework discovery and updates.
