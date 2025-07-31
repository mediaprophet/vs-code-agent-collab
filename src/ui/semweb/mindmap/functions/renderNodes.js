// renderNodes.js
// Node rendering logic for mindmap

export function renderNodes(mindMap, canvas, zoom, panX, panY, selectedNodeId, selectedNodeIds, NODE_TYPES, enableInlineEditing, pushHistory, renderMindMap, showNodeDetails) {
  mindMap.nodes.forEach(node => {
    const el = document.createElement('div');
    el.className = 'mindmap-node';
    el.style.position = 'absolute';
    el.style.left = ((node.x || 50) * zoom + panX) + 'px';
    el.style.top = ((node.y || 50) * zoom + panY) + 'px';
    el.style.transform = `scale(${zoom})`;
    el.textContent = node.label + ' (' + node.type + ')';
    if (node.group) {
      let hash = 0; for (let i = 0; i < node.group.length; i++) hash = node.group.charCodeAt(i) + ((hash << 5) - hash);
      const color = `hsl(${hash % 360},70%,85%)`;
      el.style.background = color;
      el.style.border = '2px solid #888';
    }
    el.onclick = (e) => {
      if (e.ctrlKey) {
        if (selectedNodeIds.has(node.id)) {
          selectedNodeIds.delete(node.id);
        } else {
          selectedNodeIds.add(node.id);
        }
        selectedNodeId = null;
        renderMindMap();
        document.getElementById('node-details').innerHTML = '';
      } else {
        selectedNodeId = node.id;
        selectedNodeIds.clear();
        renderMindMap();
        showNodeDetails(node, mindMap, selectedNodeId, pushHistory, renderMindMap, id => { selectedNodeId = id; });
      }
    };
    if (selectedNodeId === node.id) el.classList.add('selected');
    if (selectedNodeIds.has(node.id)) el.classList.add('bulk-selected');
    el.ondblclick = (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = node.label;
      input.onblur = () => {
        node.label = input.value;
        pushHistory();
        renderMindMap();
      };
      input.onkeydown = (ev) => {
        if (ev.key === 'Enter') input.blur();
      };
      el.innerHTML = '';
      el.appendChild(input);
      input.focus();
    };
    el.oncontextmenu = (e) => {
      e.preventDefault();
      el.innerHTML = '';
      const select = document.createElement('select');
      NODE_TYPES.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        if (type === node.type) opt.selected = true;
        select.appendChild(opt);
      });
      select.onblur = () => {
        el.innerHTML = node.label + ' (' + node.type + ')';
      };
      select.onchange = () => {
        node.type = select.value;
        pushHistory();
        renderMindMap();
      };
      el.appendChild(select);
      select.focus();
    };
    enableInlineEditing(el, node, () => { pushHistory(); renderMindMap(); });
    canvas.appendChild(el);
  });
}
