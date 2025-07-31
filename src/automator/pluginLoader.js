// src/automator/pluginLoader.js
// Global Plugin Loader for the Entire Extension

import fs from 'fs';
import path from 'path';

const PLUGIN_DIR = path.resolve('.automator/plugins');

/**
 * Loads all valid plugins for the entire extension from .automator/plugins.
 * Plugins can contribute to any module: mindmap, ontology, UI, automation, etc.
 *
 * @param {object} api - The extension API for plugin registration.
 * @returns {Array} Array of loaded plugin manifests.
 */
export function loadPlugins(api) {
  const loaded = [];
  if (!fs.existsSync(PLUGIN_DIR)) return loaded;
  const pluginFolders = fs.readdirSync(PLUGIN_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(PLUGIN_DIR, d.name));
  for (const folder of pluginFolders) {
    const manifestPath = path.join(folder, 'plugin.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const mainScript = path.join(folder, manifest.main || 'index.js');
      if (fs.existsSync(mainScript)) {
        const plugin = require(mainScript);
        if (typeof plugin === 'function') {
          plugin(api); // Register with extension API
        }
        loaded.push(manifest);
        console.log(`[PluginLoader] Loaded plugin: ${manifest.name}`);
      }
    } catch (e) {
      console.warn(`[PluginLoader] Failed to load plugin in ${folder}:`, e);
    }
  }
  return loaded;
}
