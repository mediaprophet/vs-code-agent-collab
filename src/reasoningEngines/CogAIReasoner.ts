import { ReasoningEngine } from './ReasoningEngine';
import { Chunk, ChunkGraph, Thought, ThoughtGraph, Rule } from './CogAITypes';
import { CogAIChunkParser } from './CogAIChunkParser';
export class CogAIReasoner implements ReasoningEngine {
    private ontology: object = {};
    private thoughtGraph: ThoughtGraph = {};
    private chunkGraph: ChunkGraph = {};
    private rules: Rule[] = [];

        /**
         * Loads ontology as either a JSON thought graph or a chunk/rule grammar string.
         */
    async loadOntology(data: string, format: string): Promise<void> {
        if (format === 'json') {
            this.ontology = JSON.parse(data);
        } else if (format === 'chunk') {
            const parsed = CogAIChunkParser.parse(data);
            this.chunkGraph = parsed.chunkGraph;
            this.rules = parsed.rules;
        } else {
            throw new Error('Only JSON or chunk format supported for ontology');
        }
    }

        /**
         * Runs reasoning: applies rules to the chunk graph, and also supports the ThoughtGraph process.
         */
        async reason(profile: string): Promise<object> {
            // If profile is JSON, use ThoughtGraph logic; if chunk, use chunk/rule logic
            let usedChunkMode = false;
            try {
                const initialThoughts: Thought[] = JSON.parse(profile);
                for (const thought of initialThoughts) {
                    this.thoughtGraph[thought.id] = thought;
                }
                // Simple reasoning: objective, evidence, synthesis
                const objective = initialThoughts.find(t => t.thought_type === 'objective');
                if (!objective) {
                    return { message: 'No objective found in the reasoning profile.' };
                }
                const evidence = Object.values(this.thoughtGraph).filter(t => t.thought_type === 'evidence');
                const synthesis: Thought = {
                    id: 'synthesis-1',
                    content: `Based on the evidence, we can conclude...`,
                    thought_type: 'synthesis',
                    dependencies: evidence.map(e => e.id),
                    confidence: 0.8
                };
                this.thoughtGraph[synthesis.id] = synthesis;
            } catch {
                // Not JSON: try chunk/rule mode
                usedChunkMode = true;
            }

            if (usedChunkMode) {
                // Apply rules to all chunks
                let changed = true;
                while (changed) {
                    changed = false;
                    for (const rule of this.rules) {
                        for (const chunk of Object.values(this.chunkGraph)) {
                            let match = true;
                            for (const [k, v] of Object.entries(rule.pattern)) {
                                if (k === 'type') {
                                    if (chunk.type !== v) match = false;
                                } else if (chunk.attributes[k] !== v) {
                                    match = false;
                                }
                            }
                            if (match) {
                                const before = JSON.stringify(chunk.attributes);
                                rule.action(chunk, this.chunkGraph);
                                if (JSON.stringify(chunk.attributes) !== before) changed = true;
                            }
                        }
                    }
                }
                return {
                    message: 'CogAI chunk/rule reasoning complete.',
                    chunkGraph: this.chunkGraph,
                    rules: this.rules.map(r => r.id)
                };
            }

            return {
                message: 'CogAI reasoning complete.',
                thoughtGraph: this.thoughtGraph
            };
        }
    }
