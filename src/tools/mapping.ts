import * as vscode from 'vscode';

export interface Mapping {
  id: string;
  source: string;
  target: string;
  description?: string;
}

const MAPPINGS_KEY = 'uiTextAreaMappings';

export function getMappings(context: vscode.ExtensionContext): Mapping[] {
  return context.globalState.get<Mapping[]>(MAPPINGS_KEY, []);
}

export async function addMapping(context: vscode.ExtensionContext, mapping: Mapping) {
  const mappings = getMappings(context);
  mappings.push(mapping);
  await context.globalState.update(MAPPINGS_KEY, mappings);
}

export async function removeMapping(context: vscode.ExtensionContext, id: string) {
  let mappings = getMappings(context);
  mappings = mappings.filter(m => m.id !== id);
  await context.globalState.update(MAPPINGS_KEY, mappings);
}
