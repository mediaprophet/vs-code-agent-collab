/**
 * SPARQL Reasoning Engine Stub
 */

import { ReasoningEngine } from './ReasoningEngine';
import { RDFGraph } from './rdf-utils';

/**
 * Minimal SPARQL Reasoner implementation.
 * Only supports Turtle input and basic SELECT triple pattern queries.
 */
export class SPARQLReasoner implements ReasoningEngine {
    private graph: RDFGraph = new RDFGraph();

    async loadOntology(data: string, format: string): Promise<void> {
        if (format !== 'turtle') throw new Error('Only Turtle format supported in this minimal SPARQLReasoner');
        this.graph = new RDFGraph();
        const lines = data.split('\n');
        for (const line of lines) {
            const m = line.match(/^\s*<([^>]+)>\s+<([^>]+)>\s+<([^>]+)>\s*\./);
            if (m) {
                this.graph.addTriple(m[1], m[2], m[3]);
            }
        }
    }

    async reason(profile: string): Promise<object> {
        return { message: 'SPARQL reasoning not implemented. Use sparql().' };
    }

    async sparql(query: string): Promise<object> {
        // Very minimal SELECT * WHERE { ?s ?p ?o } support
        if (/SELECT \* WHERE \{ \?s \?p \?o \}/.test(query)) {
            return { results: this.graph.getAllTriples() };
        }
        return { error: 'Only SELECT * WHERE { ?s ?p ?o } supported in this minimal SPARQLReasoner.' };
    }
}
