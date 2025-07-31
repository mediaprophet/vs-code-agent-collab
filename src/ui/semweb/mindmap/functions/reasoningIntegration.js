// reasoningIntegration.js
// Handles reasoning engine registration, UI wiring, invocation, and result display for the mindmap
import { populateReasoningUI } from './reasoningUI.js';
import { ToolsSystem } from '../../toolsSystem.js';
import { RDFSReasoningEngine } from '../../reasoningEngines/rdfsEngine.js';
import { OWLReasoningEngine } from '../../reasoningEngines/owlEngine.js';
import { SHACLReasoningEngine } from '../../reasoningEngines/shaclEngine.js';
import { SPARQLReasoningEngine } from '../../reasoningEngines/sparqlEngine.js';
import { RuleBasedReasoningEngine } from '../../reasoningEngines/ruleBasedEngine.js';
import { CogAIReasoningEngine } from '../../reasoningEngines/cogaiEngine.js';
import { RuleMLReasoningEngine } from '../../reasoningEngines/rulemlEngine.js';
import { ODRLReasoningEngine } from '../../reasoningEngines/odrlEngine.js';
import { SWRLReasoningEngine } from '../../reasoningEngines/swrlEngine.js';

export const toolsSystem = new ToolsSystem();
toolsSystem.register('reasoner', 'RDFS', new RDFSReasoningEngine());
toolsSystem.register('reasoner', 'OWL RL/DL', new OWLReasoningEngine());
toolsSystem.register('reasoner', 'SHACL', new SHACLReasoningEngine());
toolsSystem.register('reasoner', 'SPARQL', new SPARQLReasoningEngine());
toolsSystem.register('reasoner', 'Rule-Based', new RuleBasedReasoningEngine());
toolsSystem.register('reasoner', 'CogAI', new CogAIReasoningEngine());
toolsSystem.register('reasoner', 'RuleML', new RuleMLReasoningEngine());
toolsSystem.register('reasoner', 'ODRL', new ODRLReasoningEngine());
toolsSystem.register('reasoner', 'SWRL', new SWRLReasoningEngine());

let selectedReasoner = null;
let selectedReasonerProfile = null;

export function setReasoner(name) {
  selectedReasoner = toolsSystem.get('reasoner', name);
}
export function setReasonerProfile(profile) {
  selectedReasonerProfile = profile;
}

export function setupReasoningIntegration(getOntologyData) {
  document.addEventListener('DOMContentLoaded', () => {
    populateReasoningUI(toolsSystem);
    const engineSelect = document.getElementById('engine-select');
    const profileSelect = document.getElementById('profile-select');
    const runBtn = document.getElementById('run-reasoning');
    const resultPanel = document.getElementById('reasoning-result');
    if (engineSelect) engineSelect.onchange = () => setReasoner(engineSelect.value);
    if (profileSelect) profileSelect.onchange = () => setReasonerProfile(profileSelect.value);
    if (runBtn) {
      runBtn.onclick = async () => {
        if (!selectedReasoner || !selectedReasonerProfile) {
          alert('Please select a reasoning engine and profile.');
          return;
        }
        try {
          const ontologyData = getOntologyData();
          await selectedReasoner.loadOntology(ontologyData, 'turtle');
          const results = await selectedReasoner.reason(selectedReasonerProfile);
          if (resultPanel) {
            resultPanel.textContent = JSON.stringify(results, null, 2);
            resultPanel.style.color = '#222';
          }
        } catch (err) {
          if (resultPanel) {
            resultPanel.textContent = 'Reasoning error: ' + err.message;
            resultPanel.style.color = '#c00';
          }
        }
      };
    }
  });
}
