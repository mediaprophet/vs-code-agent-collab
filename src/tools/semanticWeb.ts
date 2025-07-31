// --- Namespaces ---
export async function readNamespaces(): Promise<Array<{ prefix: string, uri: string }>> {
  const { namespacesFile } = await ensureAutomatorSemWebStructure();
  if (!namespacesFile) return [];
  try {
    const data = await fs.readFile(namespacesFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeNamespaces(namespaces: Array<{ prefix: string, uri: string }>): Promise<boolean> {
  const { namespacesFile } = await ensureAutomatorSemWebStructure();
  if (!namespacesFile) return false;
  await fs.writeFile(namespacesFile, JSON.stringify(namespaces, null, 2), 'utf8');
  return true;
}

// --- Mappings ---
export async function readMappings(): Promise<any[]> {
  const { mappingsFile } = await ensureAutomatorSemWebStructure();
  if (!mappingsFile) return [];
  try {
    const data = await fs.readFile(mappingsFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeMappings(mappings: any[]): Promise<boolean> {
  const { mappingsFile } = await ensureAutomatorSemWebStructure();
  if (!mappingsFile) return false;
  await fs.writeFile(mappingsFile, JSON.stringify(mappings, null, 2), 'utf8');
  return true;
}

// --- SPARQL History ---
export async function readSparqlHistory(): Promise<any[]> {
  const { sparqlHistoryFile } = await ensureAutomatorSemWebStructure();
  if (!sparqlHistoryFile) return [];
  try {
    const data = await fs.readFile(sparqlHistoryFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeSparqlHistory(history: any[]): Promise<boolean> {
  const { sparqlHistoryFile } = await ensureAutomatorSemWebStructure();
  if (!sparqlHistoryFile) return false;
  await fs.writeFile(sparqlHistoryFile, JSON.stringify(history, null, 2), 'utf8');
  return true;
}
// Ensure .automator/semweb/ and recommended files exist
export async function ensureAutomatorSemWebStructure(): Promise<{
  semwebDir?: string,
  dataFile?: string,
  namespacesFile?: string,
  mappingsFile?: string,
  sparqlHistoryFile?: string
}> {
  const automatorPath = getAutomatorFolderPath();
  if (!automatorPath) return {};
  const semwebDir = path.join(automatorPath, 'semweb');
  await fs.mkdir(semwebDir, { recursive: true });
  // Data file
  const dataFile = path.join(semwebDir, 'data.ttl');
  try { await fs.access(dataFile); } catch { await fs.writeFile(dataFile, '', 'utf8'); }
  // Namespaces
  const namespacesFile = path.join(semwebDir, 'namespaces.json');
  try { await fs.access(namespacesFile); } catch { await fs.writeFile(namespacesFile, '[]', 'utf8'); }
  // Mappings
  const mappingsFile = path.join(semwebDir, 'mappings.json');
  try { await fs.access(mappingsFile); } catch { await fs.writeFile(mappingsFile, '[]', 'utf8'); }
  // SPARQL history
  const sparqlHistoryFile = path.join(semwebDir, 'sparql-history.json');
  try { await fs.access(sparqlHistoryFile); } catch { await fs.writeFile(sparqlHistoryFile, '[]', 'utf8'); }
  return { semwebDir, dataFile, namespacesFile, mappingsFile, sparqlHistoryFile };
}
// File-based RDF storage in .automator/semweb/data.ttl
export async function ensureSemWebDataFile(): Promise<string | undefined> {
  const automatorPath = getAutomatorFolderPath();
  if (!automatorPath) return undefined;
  const semwebDir = path.join(automatorPath, 'semweb');
  await fs.mkdir(semwebDir, { recursive: true });
  const dataFile = path.join(semwebDir, 'data.ttl');
  // Create file if missing
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '', 'utf8');
  }
  return dataFile;
}

export async function readSemWebDataFile(): Promise<string | undefined> {
  const file = await ensureSemWebDataFile();
  if (!file) return undefined;
  return fs.readFile(file, 'utf8');
}

export async function writeSemWebDataFile(content: string): Promise<boolean> {
  const file = await ensureSemWebDataFile();
  if (!file) return false;
  await fs.writeFile(file, content, 'utf8');
  return true;
}

// Stub for future embedded triple store support
// e.g., LevelGraph, quadstore, or similar
export async function getEmbeddedTripleStore() {
  // TODO: Implement embedded triple store option
  throw new Error('Embedded triple store not implemented yet.');
}
import * as fs from 'fs/promises';
import * as path from 'path';
import jsonld from 'jsonld';
import { Writer, Parser } from 'n3';
import * as $rdf from 'rdflib';
import { getAutomatorFolderPath } from './automatorFolder';

export async function ensureOntologiesFolder(): Promise<string | undefined> {
  const automatorPath = getAutomatorFolderPath();
  if (!automatorPath) return undefined;
  const ontologiesPath = path.join(automatorPath, 'ontologies');
  try {
    await fs.mkdir(ontologiesPath, { recursive: true });
    return ontologiesPath;
  } catch {
    return undefined;
  }
}

export async function saveOriginalOntology(filename: string, content: string): Promise<string | undefined> {
  const folder = await ensureOntologiesFolder();
  if (!folder) return undefined;
  const filePath = path.join(folder, filename);
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

export async function convertOntologyToRDFJSON(ontologyContent: string, format: 'jsonld' | 'turtle' | 'rdfxml' = 'jsonld'): Promise<string | undefined> {
  try {
    if (format === 'jsonld') {
      // Try to parse as JSON-LD and reserialize
      const doc = JSON.parse(ontologyContent);
      const compacted = await jsonld.compact(doc, {});
      return JSON.stringify(compacted, null, 2);
    } else if (format === 'turtle') {
      // Parse Turtle and convert to JSON-LD
      const parser = new Parser();
      const quads = parser.parse(ontologyContent);
      const writer = new Writer({ format: 'application/ld+json' });
      writer.addQuads(quads);
      return await new Promise<string>((resolve, reject) => {
        writer.end((error: Error | null, result: string | null) => {
          if (error) reject(error);
          else resolve(result || '');
        });
      });
    } else if (format === 'rdfxml') {
      // Parse RDF/XML and convert to JSON-LD using rdflib
      const store = $rdf.graph();
      $rdf.parse(ontologyContent, store, '', 'application/rdf+xml');
      const jsonldStr = $rdf.serialize(null, store, '', 'application/ld+json');
      return typeof jsonldStr === 'string' ? jsonldStr : JSON.stringify(jsonldStr);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function saveOntologyRDFJSON(filename: string, rdfjson: string): Promise<string | undefined> {
  const folder = await ensureOntologiesFolder();
  if (!folder) return undefined;
  const outPath = path.join(folder, filename.replace(/\.[^.]+$/, '.rdf.json'));
  await fs.writeFile(outPath, rdfjson, 'utf8');
  return outPath;
}

export async function addOntology(originalName: string, content: string, format: 'jsonld' | 'turtle' | 'rdfxml' = 'jsonld'): Promise<{ original: string, rdfjson?: string }> {
  const originalPath = await saveOriginalOntology(originalName, content);
  let rdfjsonPath;
  const rdfjson = await convertOntologyToRDFJSON(content, format);
  if (rdfjson) {
    rdfjsonPath = await saveOntologyRDFJSON(originalName, rdfjson);
  }
  return { original: originalPath!, rdfjson: rdfjsonPath };
}
