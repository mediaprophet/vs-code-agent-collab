/**
 * Minimal RDF graph and triple utilities for reasoning engines.
 * (In a real project, use rdflib.js, N3.js, or similar libraries for full RDF support.)
 */

export type RDFTriple = [string, string, string];

export class RDFGraph {
    triples: RDFTriple[] = [];

    addTriple(s: string, p: string, o: string) {
        this.triples.push([s, p, o]);
    }

    getTriplesBySubject(subject: string): RDFTriple[] {
        return this.triples.filter(([s]) => s === subject);
    }

    getTriplesByPredicate(predicate: string): RDFTriple[] {
        return this.triples.filter(([, p]) => p === predicate);
    }

    getTriplesByObject(object: string): RDFTriple[] {
        return this.triples.filter(([, , o]) => o === object);
    }

    getAllTriples(): RDFTriple[] {
        return this.triples;
    }
}
