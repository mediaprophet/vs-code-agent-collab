

import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(__dirname, '../../data/mindmap.json');

/**
 * Type definition for a MindMap node.
 */
export interface MindMapNode {
    id: string;
    label: string;
    type: string;
    [key: string]: any;
}

/**
 * Type definition for a MindMap edge.
 */
export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
    [key: string]: any;
}

/**
 * Type definition for the MindMap ontology structure.
 */
export interface MindMapOntology {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
    [key: string]: any;
}

/**
 * Loads the mindmap ontology from the data file.
 * @returns Promise of the mindmap ontology object, or empty object on error
 */
export async function loadMindMapOntology(): Promise<MindMapOntology> {
    try {
        if (fs.existsSync(DATA_PATH)) {
            return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as MindMapOntology;
        }
        return { nodes: [], edges: [] };
    } catch (err) {
        // Optionally log or notify user
        return { nodes: [], edges: [] };
    }
}

/**
 * Saves the mindmap ontology to the data file.
 * @param mindMap The mindmap ontology object
 */
export async function saveMindMapOntology(mindMap: MindMapOntology): Promise<void> {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(mindMap, null, 2), 'utf8');
    } catch (err) {
        // Optionally log or notify user
    }
}
