import * as vscode from 'vscode';
import { createAutomatorFolder, createAutomatorSettingsFile, addAutomatorResourceFile, AutomatorSettings } from './automatorFolder';

/**
 * Prepares a context file for the LLM based on user input and workspace state.
 * @param userDescription The user's freeform project description.
 * @param additionalContext Any extra context to include (optional).
 * @returns The string content to send to the LLM.
 */
export function buildLLMContextFile(userDescription: string, additionalContext: string = ''): string {
  return `# Project Description\n${userDescription}\n\n# Workspace Context\n${additionalContext}`;
}

/**
 * Handles the LLM's response, parses it, and writes config files to .automator.
 * @param llmResponse The LLM's output (expected to be JSON or config text).
 * @returns The parsed settings/config object, or undefined if invalid.
 */
export async function handleLLMProjectConfig(llmResponse: string): Promise<AutomatorSettings | undefined> {
  try {
    const config = JSON.parse(llmResponse);
    await createAutomatorFolder();
    await createAutomatorSettingsFile(config);
    // Optionally write other files if present in config
    if (config.resources && Array.isArray(config.resources)) {
      for (const res of config.resources) {
        if (res.filename && res.content) {
          await addAutomatorResourceFile(res.filename, res.content);
        }
      }
    }
    return config;
  } catch (e) {
    // If not JSON, treat as plain text and save as a resource file
    await createAutomatorFolder();
    await addAutomatorResourceFile('llm_project_notes.txt', llmResponse);
    return undefined;
  }
}

/**
 * Utility to present the generated config/settings to the user in a webview or panel.
 * @param config The AutomatorSettings object or undefined.
 * @returns A string (HTML or markdown) for display.
 */
export function presentConfigToUser(config: AutomatorSettings | undefined): string {
  if (!config) {
    return '<p>No valid configuration was generated. Please review the LLM output.</p>';
  }
  let html = '<h2>Generated Project Configuration</h2><ul>';
  for (const key of Object.keys(config)) {
    if (key === 'resources') continue;
    html += `<li><strong>${key}:</strong> ${config[key]}</li>`;
  }
  html += '</ul>';
  if (config.resources && Array.isArray(config.resources)) {
    html += '<h3>Additional Resources</h3><ul>';
    for (const res of config.resources) {
      html += `<li>${res.filename}</li>`;
    }
    html += '</ul>';
  }
  return html;
}
