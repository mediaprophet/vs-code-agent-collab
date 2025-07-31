// renderEdges.js
// Edge rendering logic for mindmap

export function renderEdges(mindMap, canvas) {
  mindMap.edges.forEach(edge => {
    const from = mindMap.nodes.find(n => n.id === edge.from);
    const to = mindMap.nodes.find(n => n.id === edge.to);
    if (from && to) {
      const edgeEl = document.createElement('div');
      edgeEl.className = 'mindmap-edge';
      edgeEl.textContent = `${from.label} -[${edge.type}]-> ${to.label}`;
      edgeEl.style.position = 'absolute';
      edgeEl.style.left = '10px';
      edgeEl.style.top = '0px';
      canvas.appendChild(edgeEl);
    }
  });
}
