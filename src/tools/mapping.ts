
import * as vscode from 'vscode';

/**
 * Represents a UI text area mapping.
 */
export interface Mapping {
  id: string;
  source: string;
  target: string;
  description?: string;
}

const MAPPINGS_KEY = 'uiTextAreaMappings';

/**
 * Gets all mappings from global state.
 * @param context The extension context
 * @returns Array of mappings
 */
export function getMappings(context: vscode.ExtensionContext): Mapping[] {
  return context.globalState.get<Mapping[]>(MAPPINGS_KEY, []);
}

/**
 * Adds a mapping to global state.
 * @param context The extension context
 * @param mapping The mapping to add
 */
export async function addMapping(context: vscode.ExtensionContext, mapping: Mapping): Promise<void> {
  const mappings = getMappings(context);
  mappings.push(mapping);
  await context.globalState.update(MAPPINGS_KEY, mappings);
}

/**
 * Removes a mapping by ID from global state.
 * @param context The extension context
 * @param id The mapping ID to remove
 */
export async function removeMapping(context: vscode.ExtensionContext, id: string): Promise<void> {
  let mappings = getMappings(context);
  mappings = mappings.filter(m => m.id !== id);
  await context.globalState.update(MAPPINGS_KEY, mappings);
}
