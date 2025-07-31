/**
 * RDFS Reasoning Engine Stub
 */

import { ReasoningEngine } from './ReasoningEngine';
import { RDFGraph, RDFTriple } from './rdf-utils';

/**
 * Minimal RDFS Reasoner implementation.
 * Only supports Turtle input and basic rdfs:subClassOf reasoning.
 */
export class RDFSReasoner implements ReasoningEngine {
    private graph: RDFGraph = new RDFGraph();

    /**
     * Loads ontology data in Turtle format.
     */
    async loadOntology(data: string, format: string): Promise<void> {
        if (format !== 'turtle') throw new Error('Only Turtle format supported in this minimal RDFSReasoner');
        // Very minimal Turtle parser: expects lines of the form <s> <p> <o> .
        this.graph = new RDFGraph();
        const lines = data.split('\n');
        for (const line of lines) {
            const m = line.match(/^\s*<([^>]+)>\s+<([^>]+)>\s+<([^>]+)>\s*\./);
            if (m) {
                this.graph.addTriple(m[1], m[2], m[3]);
            }
        }
    }

    /**
     * Performs basic RDFS subclass reasoning (rdfs:subClassOf closure).
     */
    async reason(profile: string): Promise<object> {
        // Find all subclass relations
        const SUBCLASS = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';
        const subclassTriples = this.graph.getTriplesByPredicate(SUBCLASS);
        // Build closure
        const closure: Record<string, Set<string>> = {};
        for (const [child, , parent] of subclassTriples) {
            if (!closure[child]) closure[child] = new Set();
            closure[child].add(parent);
        }
        // Compute transitive closure
        let changed = true;
        while (changed) {
            changed = false;
            for (const child in closure) {
                for (const parent of Array.from(closure[child])) {
                    if (closure[parent]) {
                        for (const grand of closure[parent]) {
                            if (!closure[child].has(grand)) {
                                closure[child].add(grand);
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
        // Return closure as JSON
        return { subclassClosure: Object.fromEntries(Object.entries(closure).map(([k, v]) => [k, Array.from(v)])) };
    }
}
