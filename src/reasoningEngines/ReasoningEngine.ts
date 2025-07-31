/**
 * Base interface for all reasoning engines.
 */
export interface ReasoningEngine {
    /**
     * Load ontology data (RDF/OWL in Turtle, RDF/XML, or JSON-LD)
     */
    loadOntology(data: string, format: string): Promise<void>;

    /**
     * Run reasoning (profile: 'rdfs', 'owlrl', 'shacl', etc.)
     */
    reason(profile: string): Promise<object>;

    /**
     * Run a SPARQL query (if supported)
     */
    sparql?(query: string): Promise<object>;

    /**
     * Validate ontology using SHACL or other constraints (if supported)
     */
    validate?(): Promise<object>;
}

/**
 * Registry for reasoning engines.
 */
export class ReasoningEngineRegistry {
    private engines: Record<string, ReasoningEngine> = {};

    register(name: string, engine: ReasoningEngine) {
        this.engines[name] = engine;
    }

    get(name: string): ReasoningEngine | undefined {
        return this.engines[name];
    }

    list(): string[] {
        return Object.keys(this.engines);
    }
}
