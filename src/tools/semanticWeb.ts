/**
 * Reads namespaces from the semantic web namespaces file.
 * @returns Promise of array of namespace objects
 */
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

/**
 * Writes namespaces to the semantic web namespaces file.
 * @param namespaces Array of namespace objects
 * @returns Promise of success boolean
 */
export async function writeNamespaces(namespaces: Array<{ prefix: string, uri: string }>): Promise<boolean> {
  const { namespacesFile } = await ensureAutomatorSemWebStructure();
  if (!namespacesFile) return false;
  await fs.writeFile(namespacesFile, JSON.stringify(namespaces, null, 2), 'utf8');
  return true;
}

// --- Mappings ---
/**
 * Reads mappings from the semantic web mappings file.
 * @returns Promise of array of mappings
 */
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

/**
 * Writes mappings to the semantic web mappings file.
 * @param mappings Array of mapping objects
 * @returns Promise of success boolean
 */
export async function writeMappings(mappings: any[]): Promise<boolean> {
  const { mappingsFile } = await ensureAutomatorSemWebStructure();
  if (!mappingsFile) return false;
  await fs.writeFile(mappingsFile, JSON.stringify(mappings, null, 2), 'utf8');
  return true;
}

// --- SPARQL History ---
/**
 * Reads SPARQL query history from the semantic web history file.
 * @returns Promise of array of SPARQL history entries
 */
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

/**
 * Writes SPARQL query history to the semantic web history file.
 * @param history Array of SPARQL history entries
 * @returns Promise of success boolean
 */
export async function writeSparqlHistory(history: any[]): Promise<boolean> {
  const { sparqlHistoryFile } = await ensureAutomatorSemWebStructure();
  if (!sparqlHistoryFile) return false;
  await fs.writeFile(sparqlHistoryFile, JSON.stringify(history, null, 2), 'utf8');
  return true;
}
// Ensure .automator/semweb/ and recommended files exist
/**
 * Ensures the .automator/semweb/ directory and recommended files exist.
 * @returns Promise of paths to created/ensured files
 */
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
/**
 * Ensures the semantic web data file exists and returns its path.
 * @returns Promise of the data file path or undefined
 */
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

/**
 * Reads the semantic web data file content.
 * @returns Promise of the file content or undefined
 */
export async function readSemWebDataFile(): Promise<string | undefined> {
  const file = await ensureSemWebDataFile();
  if (!file) return undefined;
  return fs.readFile(file, 'utf8');
}

/**
 * Writes content to the semantic web data file.
 * @param content The content to write
 * @returns Promise of success boolean
 */
export async function writeSemWebDataFile(content: string): Promise<boolean> {
  const file = await ensureSemWebDataFile();
  if (!file) return false;
  await fs.writeFile(file, content, 'utf8');
  return true;
}

/**
 * Stub for future embedded triple store support (e.g., LevelGraph, quadstore).
 * @throws Error always (not implemented)
 */
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

/**
 * Ensures the ontologies folder exists and returns its path.
 * @returns Promise of the ontologies folder path or undefined
 */
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

/**
 * Saves the original ontology file content to the ontologies folder.
 * @param filename The ontology filename
 * @param content The ontology content
 * @returns Promise of the saved file path or undefined
 */
export async function saveOriginalOntology(filename: string, content: string): Promise<string | undefined> {
  const folder = await ensureOntologiesFolder();
  if (!folder) return undefined;
  const filePath = path.join(folder, filename);
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

/**
 * Converts ontology content to RDF/JSON-LD format.
 * @param ontologyContent The ontology content as a string
 * @param format The input format ('jsonld', 'turtle', 'rdfxml')
 * @returns Promise of the converted content as a string, or undefined on error
 */
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
  } catch (err) {
    // Optionally log or notify user
    return undefined;
  }
}

/**
 * Saves the RDF/JSON-LD content of an ontology to the ontologies folder.
 * @param filename The original ontology filename
 * @param rdfjson The RDF/JSON-LD content
 * @returns Promise of the saved file path or undefined
 */
export async function saveOntologyRDFJSON(filename: string, rdfjson: string): Promise<string | undefined> {
  const folder = await ensureOntologiesFolder();
  if (!folder) return undefined;
  const outPath = path.join(folder, filename.replace(/\.[^.]+$/, '.rdf.json'));
  await fs.writeFile(outPath, rdfjson, 'utf8');
  return outPath;
}

/**
 * Adds an ontology by saving the original and its RDF/JSON-LD conversion.
 * @param originalName The original ontology filename
 * @param content The ontology content
 * @param format The input format ('jsonld', 'turtle', 'rdfxml')
 * @returns Promise of paths to the original and RDF/JSON-LD files
 */
export async function addOntology(originalName: string, content: string, format: 'jsonld' | 'turtle' | 'rdfxml' = 'jsonld'): Promise<{ original: string, rdfjson?: string }> {
  const originalPath = await saveOriginalOntology(originalName, content);
  let rdfjsonPath;
  const rdfjson = await convertOntologyToRDFJSON(content, format);
  if (rdfjson) {
    rdfjsonPath = await saveOntologyRDFJSON(originalName, rdfjson);
  }
  return { original: originalPath!, rdfjson: rdfjsonPath };
}
