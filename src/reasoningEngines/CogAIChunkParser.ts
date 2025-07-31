// Parser for CogAI Chunks and Rules (simplified, placeholder for full grammar)
import { Chunk, Rule } from './CogAITypes';

export class CogAIChunkParser {
    // Parse a chunk/rule grammar string into chunkGraph and rules
    static parse(data: string): { chunkGraph: Record<string, Chunk>, rules: Rule[] } {
        const chunkGraph: Record<string, Chunk> = {};
        const rules: Rule[] = [];
        const lines = data.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (line.startsWith('chunk ')) {
                // chunk c1 type=goal status=open
                const [_, id, ...attrs] = line.split(/\s+/);
                const attributes: Record<string, any> = {};
                let type = 'chunk';
                for (const attr of attrs) {
                    const [k, v] = attr.split('=');
                    if (k === 'type') type = v;
                    else attributes[k] = v;
                }
                chunkGraph[id] = { id, type, attributes };
            } else if (line.startsWith('rule ')) {
                // rule r1 if type=goal status=open then status=active
                const ruleMatch = line.match(/^rule (\S+) if (.+) then (.+)$/);
                if (ruleMatch) {
                    const [, id, ifPart, thenPart] = ruleMatch;
                    const pattern: Partial<Chunk> = {};
                    for (const cond of ifPart.split(/\s+/)) {
                        const [k, v] = cond.split('=');
                        if (k && v) (pattern as any)[k] = v;
                    }
                    const thenActions = thenPart.split(/\s+/).map(a => a.split('='));
                    rules.push({
                        id,
                        pattern,
                        action: (matched, graph) => {
                            for (const [k, v] of thenActions) {
                                if (k && v) matched.attributes[k] = v;
                            }
                        }
                    });
                }
            }
        }
        return { chunkGraph, rules };
    }
}
