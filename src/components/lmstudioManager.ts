// lmstudioManager.ts - abstraction for LLM Studio model and memory management

import { LMStudioClient } from '@lmstudio/sdk';

const client = new LMStudioClient();


// List all local models (downloaded)
export async function listLocalModels() {
  return await client.system.listDownloadedModels();
}

// List all loaded LLM models (in memory)
export async function listLoadedModels() {
  return await client.llm.listLoaded();
}


// Load a model by modelKey (loads if not already loaded)
export async function loadModel(modelKey: string) {
  return await client.llm.model(modelKey);
}


// Unload a loaded model (by handle)
export async function unloadModel(modelKey: string) {
  // Find the loaded model handle by modelKey
  const loaded = await client.llm.listLoaded();
  const handle = loaded.find(m => m.modelKey === modelKey);
  if (handle) {
    await client.llm.model(modelKey).then(m => m.unload());
  }
}


// Get memory info (system/gpu) if available
export async function getMemoryInfo(): Promise<{ system: string; gpu?: string }> {
  // There is no direct API for memory info, but you can get model info for loaded models
  // Here, just return 'Unknown' for now, or extend if API is available
  return { system: 'Unknown' };
}
