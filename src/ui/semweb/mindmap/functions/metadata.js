// metadata.js
// Ontology metadata management

export function setupMetadata(mindMap) {
  const metadataBtn = document.getElementById('show-metadata');
  const metadataPanel = document.getElementById('metadata-panel');
  if (metadataBtn && metadataPanel) {
    metadataBtn.onclick = () => {
      const meta = JSON.stringify(mindMap, null, 2);
      metadataPanel.innerHTML = `<pre>${meta}</pre>`;
      metadataPanel.style.display = metadataPanel.style.display === 'block' ? 'none' : 'block';
    };
  }
}
