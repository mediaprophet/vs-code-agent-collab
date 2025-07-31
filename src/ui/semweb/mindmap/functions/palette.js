// palette.js
// Palette (drag-and-drop node creation) logic for mindmap

export function setupPalette(canvas, NODE_TYPES, mindMap, pushHistory, renderMindMap) {
  const palette = document.createElement('div');
  palette.id = 'mindmap-palette';
  palette.style.display = 'flex';
  palette.style.gap = '0.5em';
  palette.style.margin = '0.5em 0';
  NODE_TYPES.forEach(type => {
    const btn = document.createElement('div');
    btn.className = 'palette-node';
    btn.textContent = type;
    btn.draggable = true;
    btn.ondragstart = (e) => {
      e.dataTransfer.setData('node-type', type);
    };
    palette.appendChild(btn);
  });
  canvas.parentNode.insertBefore(palette, canvas);

  canvas.ondragover = (e) => { e.preventDefault(); };
  canvas.ondrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type');
    if (type) {
      const label = prompt('Node label?', type);
      if (label) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = { id: Date.now().toString(), label, type, x, y };
        mindMap.nodes.push(node);
        pushHistory();
        renderMindMap();
      }
    }
  };
}
