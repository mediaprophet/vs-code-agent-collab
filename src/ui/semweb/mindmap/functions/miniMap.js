// miniMap.js
// Mini-map/overview panel for mindmap navigation

export function setupMiniMap(mindMap, canvas, panZoom, renderMindMap) {
  let miniMap = document.getElementById('mindmap-minimap');
  if (!miniMap) {
    miniMap = document.createElement('canvas');
    miniMap.id = 'mindmap-minimap';
    miniMap.width = 200;
    miniMap.height = 150;
    miniMap.style.position = 'absolute';
    miniMap.style.right = '20px';
    miniMap.style.bottom = '20px';
    miniMap.style.border = '1px solid #aaa';
    miniMap.style.background = '#fff';
    miniMap.style.zIndex = 10;
    canvas.parentNode.appendChild(miniMap);
  }

  function drawMiniMap() {
    const ctx = miniMap.getContext('2d');
    ctx.clearRect(0, 0, miniMap.width, miniMap.height);
    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    mindMap.nodes.forEach(n => {
      if (typeof n.x === 'number' && typeof n.y === 'number') {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      }
    });
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return;
    const scale = Math.min(
      (miniMap.width - 20) / (maxX - minX + 1),
      (miniMap.height - 20) / (maxY - minY + 1)
    );
    // Draw edges
    mindMap.edges.forEach(e => {
      const from = mindMap.nodes.find(n => n.id === e.from);
      const to = mindMap.nodes.find(n => n.id === e.to);
      if (from && to) {
        ctx.strokeStyle = '#bbb';
        ctx.beginPath();
        ctx.moveTo(10 + (from.x - minX) * scale, 10 + (from.y - minY) * scale);
        ctx.lineTo(10 + (to.x - minX) * scale, 10 + (to.y - minY) * scale);
        ctx.stroke();
      }
    });
    // Draw nodes
    mindMap.nodes.forEach(n => {
      if (typeof n.x === 'number' && typeof n.y === 'number') {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(10 + (n.x - minX) * scale, 10 + (n.y - minY) * scale, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    // Draw viewport rectangle
    const viewW = miniMap.width * (canvas.clientWidth / (maxX - minX + 40));
    const viewH = miniMap.height * (canvas.clientHeight / (maxY - minY + 40));
    const viewX = 10 + ((-panZoom.panX) - minX) * scale;
    const viewY = 10 + ((-panZoom.panY) - minY) * scale;
    ctx.strokeStyle = '#f90';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
    ctx.lineWidth = 1;
  }

  miniMap.addEventListener('click', function(e) {
    // Pan main view to clicked location
    const rect = miniMap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    mindMap.nodes.forEach(n => {
      if (typeof n.x === 'number' && typeof n.y === 'number') {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      }
    });
    const scale = Math.min(
      (miniMap.width - 20) / (maxX - minX + 1),
      (miniMap.height - 20) / (maxY - minY + 1)
    );
    const targetX = minX + (x - 10) / scale;
    const targetY = minY + (y - 10) / scale;
    panZoom.panX = -(targetX - canvas.clientWidth / 2);
    panZoom.panY = -(targetY - canvas.clientHeight / 2);
    renderMindMap();
    drawMiniMap();
  });

  // Redraw minimap after each render
  const origRender = renderMindMap;
  renderMindMap = function() {
    origRender();
    drawMiniMap();
  };
  drawMiniMap();
  return { drawMiniMap };
}
