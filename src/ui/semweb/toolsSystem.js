// toolsSystem.js
// Pluggable tools/services system for semantic web web-extension
// Provides unified API for reasoning, SPARQL, SHACL, import/export, etc.

/**
 * Abstract base class for all semantic web tools/services.
 */
export class SemanticWebTool {
    constructor(config = {}) {
        this.config = config;
    }
    // Each tool should implement its own methods (see ReasoningTool, SparqlTool, etc.)
}

/**
 * Reasoning tool interface (pluggable engines)
 */
export class ReasoningTool extends SemanticWebTool {
    async loadOntology(data, format) { throw new Error('Not implemented'); }
    async reason(profile) { throw new Error('Not implemented'); }
}

/**
 * SPARQL tool interface
 */
export class SparqlTool extends SemanticWebTool {
    async query(sparql) { throw new Error('Not implemented'); }
}

/**
 * SHACL validation tool interface
 */
export class ShaclTool extends SemanticWebTool {
    async validate(data, shapes) { throw new Error('Not implemented'); }
}

/**
 * ToolsSystem: manages all available tools/services (reasoners, SPARQL, SHACL, etc.)
 */
export class ToolsSystem {
    constructor() {
        this.tools = {};
    }
    /**
     * Register a tool (e.g., reasoner, SPARQL, SHACL)
     * @param {string} type - Tool type (e.g., 'reasoner', 'sparql', 'shacl')
     * @param {string} name - Tool name
     * @param {SemanticWebTool} tool - Tool instance
     */
    register(type, name, tool) {
        if (!this.tools[type]) this.tools[type] = {};
        this.tools[type][name] = tool;
    }
    /**
     * Get a tool by type and name
     * @param {string} type
     * @param {string} name
     * @returns {SemanticWebTool}
     */
    get(type, name) {
        return this.tools[type]?.[name] || null;
    }
    /**
     * List all tools of a given type
     * @param {string} type
     * @returns {string[]}
     */
    list(type) {
        return Object.keys(this.tools[type] || {});
    }
}

// Example usage:
// const toolsSystem = new ToolsSystem();
// toolsSystem.register('reasoner', 'MyReasoner', new MyReasonerTool());
// toolsSystem.register('sparql', 'RemoteEndpoint', new MySparqlTool());
// ...
// UI can list/select tools by type, and invoke their methods via the unified API.
