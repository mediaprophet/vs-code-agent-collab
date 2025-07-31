// bulkOps.js
// Bulk group and bulk delete logic for mindmap

export function setupBulkOps(canvas, mindMap, selectedNodeIds, pushHistory, renderMindMap, nodeDetails) {
  // Bulk Group
  const bulkGroupBtn = document.createElement('button');
  bulkGroupBtn.textContent = 'Set Group for Selected';
  bulkGroupBtn.style.margin = '0.5em';
  bulkGroupBtn.onclick = () => {
    if (selectedNodeIds.size === 0) return;
    const group = prompt('Group name for selected nodes?');
    if (!group) return;
    const nodes = mindMap.nodes.filter(n => selectedNodeIds.has(n.id));
    nodes.forEach(n => n.group = group);
    pushHistory();
    renderMindMap();
  };
  canvas.parentNode.insertBefore(bulkGroupBtn, canvas.nextSibling);

  // Bulk Delete
  const bulkDeleteBtn = document.createElement('button');
  bulkDeleteBtn.textContent = 'Delete Selected';
  bulkDeleteBtn.style.margin = '0.5em';
  bulkDeleteBtn.onclick = () => {
    if (selectedNodeIds.size === 0) return;
    mindMap.nodes = mindMap.nodes.filter(n => !selectedNodeIds.has(n.id));
    mindMap.edges = mindMap.edges.filter(e => !selectedNodeIds.has(e.from) && !selectedNodeIds.has(e.to));
    selectedNodeIds.clear();
    pushHistory();
    renderMindMap();
    nodeDetails.innerHTML = '';
  };
  canvas.parentNode.insertBefore(bulkDeleteBtn, canvas.nextSibling);
}
