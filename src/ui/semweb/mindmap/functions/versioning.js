// versioning.js
// Ontology versioning integration

export function setupVersioning(mindMap, renderMindMap) {
  const saveVersionBtn = document.getElementById('save-version');
  const loadVersionBtn = document.getElementById('load-version');
  const versionList = document.getElementById('version-list');
  const versionStatus = document.getElementById('version-status');
  if (saveVersionBtn && versionStatus) {
    saveVersionBtn.onclick = () => {
      versionStatus.textContent = 'Saving version...';
      vscode.postMessage({ command: 'saveOntologyVersion', mindMap });
    };
  }
  if (loadVersionBtn && versionList && versionStatus) {
    loadVersionBtn.onclick = () => {
      const version = versionList.value;
      if (!version) return;
      versionStatus.textContent = 'Loading version...';
      vscode.postMessage({ command: 'loadOntologyVersion', version });
    };
  }
  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'ontologyVersionSaved') {
      versionStatus.textContent = 'Version saved.';
    } else if (msg.command === 'ontologyVersionLoaded') {
      Object.assign(mindMap, msg.mindMap);
      renderMindMap();
      versionStatus.textContent = 'Version loaded.';
    } else if (msg.command === 'ontologyVersionList') {
      versionList.innerHTML = '<option value="">--Versions--</option>' + (msg.versions||[]).map(v => `<option value="${v}">${v}</option>`).join('');
    }
  });
  if (versionList) {
    vscode.postMessage({ command: 'getOntologyVersionList' });
  }
}
