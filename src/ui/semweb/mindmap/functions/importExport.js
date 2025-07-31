// importExport.js
// Ontology import/export integration

export function setupImportExport(mindMap, renderMindMap) {
  const importBtn = document.getElementById('import-ontology');
  const exportBtn = document.getElementById('export-ontology');
  const importFileInput = document.getElementById('import-ontology-file');
  if (importBtn && importFileInput) {
    importBtn.onclick = () => importFileInput.click();
    importFileInput.onchange = (e) => {
      const file = importFileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        vscode.postMessage({ command: 'importOntology', name: file.name, content: reader.result });
      };
      reader.readAsText(file);
    };
  }
  if (exportBtn) {
    exportBtn.onclick = () => {
      vscode.postMessage({ command: 'exportOntology', mindMap });
    };
  }
  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'ontologyImported') {
      Object.assign(mindMap, msg.mindMap);
      renderMindMap();
      alert('Ontology imported successfully.');
    } else if (msg.command === 'ontologyExported') {
      const blob = new Blob([msg.content], { type: msg.mime || 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = msg.filename || 'ontology.json';
      a.click();
    }
  });
}
