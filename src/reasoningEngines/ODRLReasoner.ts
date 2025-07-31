/**
 * ODRL Reasoning Engine Stub
 */

import { ReasoningEngine } from './ReasoningEngine';

/**
 * Minimal ODRL Reasoner implementation (mocked).
 */
export class ODRLReasoner implements ReasoningEngine {
    private odrl: string = '';

    async loadOntology(data: string, format: string): Promise<void> {
        // Accepts ODRL XML/JSON as string (mocked)
        if (format !== 'odrl') throw new Error('Only ODRL format supported in this minimal ODRLReasoner');
        this.odrl = data;
    }

    async reason(profile: string): Promise<object> {
        // Mocked: just returns a stub
        return { message: 'ODRL reasoning not implemented (mocked)', odrl: this.odrl };
    }
}
