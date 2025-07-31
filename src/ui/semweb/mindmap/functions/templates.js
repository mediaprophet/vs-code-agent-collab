// templates.js
// Ontology templates integration

export function setupTemplates(mindMap, renderMindMap) {
  const templateSelect = document.getElementById('ontology-template');
  const applyTemplateBtn = document.getElementById('apply-template');
  if (applyTemplateBtn && templateSelect) {
    applyTemplateBtn.onclick = () => {
      const template = templateSelect.value;
      if (!template) return;
      vscode.postMessage({ command: 'applyOntologyTemplate', template });
    };
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'ontologyTemplateApplied') {
        Object.assign(mindMap, msg.mindMap);
        renderMindMap();
        alert('Ontology template applied.');
      }
    });
  }
}
