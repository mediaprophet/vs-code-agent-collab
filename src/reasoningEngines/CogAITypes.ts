// Types and interfaces for CogAI Chunks and Rules

export type ChunkID = string;

export interface Chunk {
    id: ChunkID;
    type: string;
    attributes: Record<string, any>;
}

export type ChunkGraph = Record<ChunkID, Chunk>;

export interface Thought {
    id: string;
    content: string;
    thought_type: 'objective' | 'hypothesis' | 'assumption' | 'question' | 'sub_problem' | 'evidence' | 'action' | 'synthesis' | 'critique';
    dependencies: string[];
    confidence: number;
    action_request?: {
        tool: string;
        parameters: object;
    };
}

export type ThoughtGraph = Record<string, Thought>;

export interface Rule {
    id: string;
    pattern: Partial<Chunk>;
    action: (matched: Chunk, graph: ChunkGraph) => void;
}
