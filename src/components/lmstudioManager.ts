
// lmstudioManager.ts - abstraction for LLM Studio model and memory management

import { LMStudioClient } from '@lmstudio/sdk';

const client = new LMStudioClient();

/**
 * Lists all local models (downloaded) in LM Studio.
 * @returns Promise of downloaded model info array
 */
export async function listLocalModels(): Promise<any[]> {
  try {
    return await client.system.listDownloadedModels();
  } catch (err) {
    // Optionally log or notify user
    return [];
  }
}

/**
 * Lists all loaded LLM models (in memory).
 * @returns Promise of loaded model info array
 */
export async function listLoadedModels(): Promise<any[]> {
  try {
    return await client.llm.listLoaded();
  } catch (err) {
    // Optionally log or notify user
    return [];
  }
}

/**
 * Loads a model by modelKey (loads if not already loaded).
 * @param modelKey The model key string
 * @returns Promise of the loaded model handle or undefined
 */
export async function loadModel(modelKey: string): Promise<any | undefined> {
  try {
    return await client.llm.model(modelKey);
  } catch (err) {
    // Optionally log or notify user
    return undefined;
  }
}

/**
 * Unloads a loaded model (by handle).
 * @param modelKey The model key string
 */
export async function unloadModel(modelKey: string): Promise<void> {
  try {
    // Find the loaded model handle by modelKey
    const loaded = await client.llm.listLoaded();
    const handle = loaded.find((m: any) => m.modelKey === modelKey);
    if (handle) {
      await client.llm.model(modelKey).then((m: any) => m.unload());
    }
  } catch (err) {
    // Optionally log or notify user
  }
}

/**
 * Gets memory info (system/gpu) if available.
 * @returns Promise of memory info object
 */
export async function getMemoryInfo(): Promise<{ system: string; gpu?: string }> {
  // There is no direct API for memory info, but you can get model info for loaded models
  // Here, just return 'Unknown' for now, or extend if API is available
  return { system: 'Unknown' };
}
