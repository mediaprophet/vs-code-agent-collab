// reasoningAPI.js
// Abstract pluggable reasoning API for semantic web integration
// See mindmapOntology.md for requirements

/**
 * Abstract interface for reasoning engines.
 * Implementations should provide these methods for RDFS, OWL, SHACL, SPARQL, etc.
 */
export class ReasoningEngine {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Load ontology data (RDF/OWL in Turtle, RDF/XML, or JSON-LD)
     * @param {string} data - Ontology data as string
     * @param {string} format - Format (e.g., 'turtle', 'rdfxml', 'jsonld')
     */
    async loadOntology(data, format) {
        throw new Error('Not implemented');
    }

    /**
     * Run reasoning (profile: 'rdfs', 'owlrl', 'shacl', etc.)
     * @param {string} profile - Reasoning profile/engine
     * @returns {Promise<object>} - Reasoning results (in standard RDF format)
     */
    async reason(profile) {
        throw new Error('Not implemented');
    }

    /**
     * Run a SPARQL query
     * @param {string} query - SPARQL query string
     * @returns {Promise<object>} - Query results
     */
    async sparql(query) {
        throw new Error('Not implemented');
    }

    /**
     * Validate ontology using SHACL or other constraints
     * @returns {Promise<object>} - Validation report
     */
    async validate() {
        throw new Error('Not implemented');
    }
}

/**
 * ReasoningEngineRegistry: manages available engines and profiles
 */
export class ReasoningEngineRegistry {
    constructor() {
        this.engines = {};
    }

    /**
     * Register a reasoning engine implementation
     * @param {string} name
     * @param {ReasoningEngine} engine
     */
    register(name, engine) {
        this.engines[name] = engine;
    }

    /**
     * Get a registered engine by name
     * @param {string} name
     * @returns {ReasoningEngine}
     */
    get(name) {
        return this.engines[name];
    }

    /**
     * List all registered engines
     * @returns {string[]}
     */
    list() {
        return Object.keys(this.engines);
    }
}

// Example: UI can use ReasoningEngineRegistry to list/select engines and profiles
// Implementations for specific engines (e.g., local JS, remote SPARQL, SHACL) should extend ReasoningEngine
