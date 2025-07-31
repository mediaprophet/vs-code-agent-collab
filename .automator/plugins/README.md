# MindMap Automator Plugin System

This folder contains plugins for the MindMap Ontology Workspace. Each plugin should be a self-contained module that can extend or modify the behavior of the mindmap tool.

## Plugin Structure
- Each plugin resides in its own subfolder under `.automator/plugins/`.
- A plugin must include a `plugin.json` manifest and at least one entrypoint script (e.g., `index.js`).
- Plugins can provide UI components, backend logic, or both.

## Example Plugin Folder Structure

.automator/plugins/
  my-sample-plugin/
    plugin.json
    index.js
    ...

## Plugin Manifest (`plugin.json`)

## Plugin Manifest (`plugin.json`)

## Plugin Manifest (`plugin.json`)
- `name`: Plugin name
- `version`: Plugin version
- `description`: Short description
- `main`: Entrypoint script (e.g., `index.js`)
- `contributions`: (optional) UI panels, commands, etc.

## Plugin API
Plugins receive an API object with the following methods:
- `registerPanel(id, panelDef)`: Register a custom panel.
- `registerCommand(id, handler)`: Register a custom command callable from the extension or other plugins.
- `onEvent(event, handler)`: Listen for extension events (e.g., file saved, mindmap updated).
- `getData(key)`: Access extension data (e.g., mindmap, settings).
- `setData(key, value)`: Update extension data.
- `vscode`, `context`: Access to VS Code API and extension context.

See the sample plugins for usage examples.

## Plugin API
Plugins receive an API object with the following methods:
- `registerPanel(id, panelDef)`: Register a custom panel.
- `registerCommand(id, handler)`: Register a custom command callable from the extension or other plugins.
- `onEvent(event, handler)`: Listen for extension events (e.g., file saved, mindmap updated).
- `getData(key)`: Access extension data (e.g., mindmap, settings).
- `setData(key, value)`: Update extension data.
- `vscode`, `context`: Access to VS Code API and extension context.

See the sample plugins for usage examples.

## Loading Plugins
- The mindmap tool will scan `.automator/plugins/` at startup and load all valid plugins.
- Plugins can register new commands, panels, or extend existing features via the plugin API.

## Example `plugin.json`
```json
{
  "name": "Sample Plugin",
  "version": "1.0.0",
  "description": "Adds a custom panel to the mindmap UI.",
  "main": "index.js",
  "contributions": {
    "panels": ["CustomPanel"]
  }
}
```

## Example `index.js`
```js
module.exports = function register(api) {
  api.registerPanel('CustomPanel', {
    title: 'My Custom Panel',
    render: (container) => {
      container.innerHTML = '<h2>Hello from plugin!</h2>';
    }
  });
};
```

---

See the main documentation for details on the plugin API and extension points.
