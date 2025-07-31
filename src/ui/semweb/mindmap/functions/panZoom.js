// panZoom.js
// Pan and zoom logic for mindmap

export function createPanZoom(canvas, renderMindMap) {
  let panX = 0, panY = 0, zoom = 1;
  let isPanning = false, lastPan = { x: 0, y: 0 };

  canvas.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom *= delta;
    renderMindMap();
  };
  canvas.onmousedown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      isPanning = true;
      lastPan = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    }
  };
  canvas.onmousemove = (e) => {
    if (isPanning) {
      panX += (e.clientX - lastPan.x);
      panY += (e.clientY - lastPan.y);
      lastPan = { x: e.clientX, y: e.clientY };
      renderMindMap();
    }
  };
  canvas.onmouseup = () => { isPanning = false; canvas.style.cursor = ''; };
  canvas.onmouseleave = () => { isPanning = false; canvas.style.cursor = ''; };

  return {
    get panX() { return panX; },
    get panY() { return panY; },
    get zoom() { return zoom; },
    set panX(x) { panX = x; },
    set panY(y) { panY = y; },
    set zoom(z) { zoom = z; }
  };
}
