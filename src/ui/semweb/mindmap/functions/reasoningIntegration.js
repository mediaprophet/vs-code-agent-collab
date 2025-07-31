// reasoningIntegration.js
// Handles reasoning engine registration, UI wiring, invocation, and result display for the mindmap

import { populateReasoningUI } from './reasoningUI.js';
import { reasoningEngineRegistry, getReasoner, listReasoners } from '../../../../reasoningEngines/index.js';

let selectedReasoner = null;
let selectedReasonerProfile = null;

export function setReasoner(name) {
  selectedReasoner = getReasoner(name);
}
export function setReasonerProfile(profile) {
  selectedReasonerProfile = profile;
}

export function setupReasoningIntegration(getOntologyData) {
  document.addEventListener('DOMContentLoaded', () => {
    // Use the new registry for engine listing
    const toolsSystem = {
      list: () => listReasoners(),
    };
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
