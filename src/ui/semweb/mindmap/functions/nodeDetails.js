// nodeDetails.js
// Handles node details panel, custom properties, and annotation logic for the mindmap

export function showNodeDetails(node, mindMap, selectedNodeId, pushHistory, renderMindMap, setSelectedNodeId) {
  const nodeDetails = document.getElementById('node-details');
  const NODE_TYPES = ['class', 'property', 'individual', 'relation', 'note'];
  // Ensure customProperties and annotation exist
  if (!node.customProperties) node.customProperties = {};
  if (!('annotation' in node)) node.annotation = '';
  nodeDetails.innerHTML = `<h2 contenteditable='true' id='edit-label'>${node.label}</h2>
    <div>Type: <select id='edit-type'>${NODE_TYPES.map(t => `<option value='${t}'${t===node.type?' selected':''}>${t}</option>`).join('')}</select></div>
    <h3>Custom Properties</h3>
    <table id='custom-props-table' style='margin-bottom:0.5em;'>
      ${Object.entries(node.customProperties).map(([k,v]) => `
        <tr>
          <td><input type='text' class='custom-key' value='${k}' data-oldkey='${k}' style='width:6em;'></td>
          <td><input type='text' class='custom-value' value='${v}' data-key='${k}' style='width:10em;'></td>
          <td><button class='delete-prop' data-key='${k}'>Delete</button></td>
        </tr>`).join('')}
    </table>
    <button id='add-prop'>Add Property</button>
    <h3>Annotation</h3>
    <textarea id='node-annotation' rows='2' style='width:98%;margin-bottom:0.5em;'>${node.annotation||''}</textarea>
    <button id='delete-node'>Delete Node</button>
    <h3>Add Edge</h3>
    <select id='target-node'>${mindMap.nodes.filter(n => n.id!==node.id).map(n => `<option value='${n.id}'>${n.label}</option>`).join('')}</select>
    <select id='edge-type'>${['subclass','property','relation','custom','note'].map(t => `<option value='${t}'>${t}</option>`).join('')}</select>
    <button id='add-edge'>Add Edge</button>
    <h3>Edges</h3>
    <ul>${mindMap.edges.filter(e=>e.from===node.id||e.to===node.id).map(e=>`<li>${e.from===node.id?'→':'←'} ${e.type} ${e.from===node.id?mindMap.nodes.find(n=>n.id===e.to)?.label:mindMap.nodes.find(n=>n.id===e.from)?.label} <button data-from='${e.from}' data-to='${e.to}' data-type='${e.type}' class='delete-edge'>Delete</button></li>`).join('')}</ul>`;

  document.getElementById('edit-label').onblur = (e) => {
    node.label = e.target.textContent;
    pushHistory();
    renderMindMap();
  };
  document.getElementById('edit-type').onchange = (e) => {
    node.type = e.target.value;
    pushHistory();
    renderMindMap();
  };
  document.getElementById('delete-node').onclick = () => {
    mindMap.nodes = mindMap.nodes.filter(n => n.id !== node.id);
    mindMap.edges = mindMap.edges.filter(e => e.from !== node.id && e.to !== node.id);
    setSelectedNodeId(null);
    pushHistory();
    renderMindMap();
    nodeDetails.innerHTML = '';
  };
  document.getElementById('add-edge').onclick = () => {
    const to = document.getElementById('target-node').value;
    const type = document.getElementById('edge-type').value;
    mindMap.edges.push({ from: node.id, to, type });
    pushHistory();
    renderMindMap();
    showNodeDetails(node, mindMap, selectedNodeId, pushHistory, renderMindMap, setSelectedNodeId);
  };
  document.querySelectorAll('.delete-edge').forEach(btn => {
    btn.onclick = (e) => {
      const { from, to, type } = btn.dataset;
      mindMap.edges = mindMap.edges.filter(edge => !(edge.from === from && edge.to === to && edge.type === type));
      pushHistory();
      renderMindMap();
      showNodeDetails(node, mindMap, selectedNodeId, pushHistory, renderMindMap, setSelectedNodeId);
    };
  });
  // Custom Properties: add, edit, delete
  document.getElementById('add-prop').onclick = () => {
    const key = prompt('Property key?');
    if (!key) return;
    if (node.customProperties[key]) {
      alert('Property already exists.');
      return;
    }
    node.customProperties[key] = '';
    pushHistory();
    showNodeDetails(node, mindMap, selectedNodeId, pushHistory, renderMindMap, setSelectedNodeId);
  };
  document.querySelectorAll('.delete-prop').forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.key;
      delete node.customProperties[key];
      pushHistory();
      showNodeDetails(node, mindMap, selectedNodeId, pushHistory, renderMindMap, setSelectedNodeId);
    };
  });
  document.querySelectorAll('.custom-key').forEach(input => {
    input.onblur = () => {
      const oldKey = input.dataset.oldkey;
      const newKey = input.value;
      if (!newKey || newKey === oldKey) return;
      if (node.customProperties[newKey]) {
        alert('Property already exists.');
        input.value = oldKey;
        return;
      }
      node.customProperties[newKey] = node.customProperties[oldKey];
      delete node.customProperties[oldKey];
      pushHistory();
      showNodeDetails(node, mindMap, selectedNodeId, pushHistory, renderMindMap, setSelectedNodeId);
    };
  });
  document.querySelectorAll('.custom-value').forEach(input => {
    input.onblur = () => {
      const key = input.dataset.key;
      node.customProperties[key] = input.value;
      pushHistory();
    };
  });
  // Annotation: save on blur
  document.getElementById('node-annotation').onblur = (e) => {
    node.annotation = e.target.value;
    pushHistory();
  };
}
