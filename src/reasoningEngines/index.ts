// Central registry and connector for all reasoning engines
import { ReasoningEngineRegistry } from './ReasoningEngine';
import { RDFSReasoner } from './RDFSReasoner';
import { OWLReasoner } from './OWLReasoner';
import { SHACLReasoner } from './SHACLReasoner';
import { SPARQLReasoner } from './SPARQLReasoner';
import { RuleMLReasoner } from './RuleMLReasoner';
import { ODRLReasoner } from './ODRLReasoner';
import { CogAIReasoner } from './CogAIReasoner';
import { SWRLReasoner } from './SWRLReasoner';
import { RuleBasedReasoner } from './RuleBasedReasoner';

// Create and export a singleton registry
export const reasoningEngineRegistry = new ReasoningEngineRegistry();

// Register all engines
reasoningEngineRegistry.register('rdfs', new RDFSReasoner());
reasoningEngineRegistry.register('owl', new OWLReasoner());
reasoningEngineRegistry.register('shacl', new SHACLReasoner());
reasoningEngineRegistry.register('sparql', new SPARQLReasoner());
reasoningEngineRegistry.register('ruleml', new RuleMLReasoner());
reasoningEngineRegistry.register('odrl', new ODRLReasoner());
reasoningEngineRegistry.register('cogai', new CogAIReasoner());
reasoningEngineRegistry.register('swrl', new SWRLReasoner());
reasoningEngineRegistry.register('rulebased', new RuleBasedReasoner());

// Connector function for components/extensions
type ReasonerType = 'rdfs'|'owl'|'shacl'|'sparql'|'ruleml'|'odrl'|'cogai'|'swrl'|'rulebased';
export function getReasoner(type: ReasonerType) {
    return reasoningEngineRegistry.get(type);
}

export function listReasoners(): string[] {
    return reasoningEngineRegistry.list();
}
