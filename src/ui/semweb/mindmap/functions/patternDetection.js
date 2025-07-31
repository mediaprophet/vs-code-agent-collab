// patternDetection.js
// Ontology pattern and anti-pattern detection for mindmap

export function setupPatternDetection(mindMap, renderMindMap) {
  let patternPanel = document.getElementById('mindmap-pattern-panel');
  if (!patternPanel) {
    patternPanel = document.createElement('div');
    patternPanel.id = 'mindmap-pattern-panel';
    patternPanel.style.position = 'absolute';
    patternPanel.style.right = '20px';
    patternPanel.style.top = '20px';
    patternPanel.style.background = '#fff';
    patternPanel.style.border = '1px solid #aaa';
    patternPanel.style.padding = '0.5em 1em';
    patternPanel.style.zIndex = 10;
    patternPanel.style.fontSize = '0.95em';
    patternPanel.innerHTML = `
      <b>Pattern Detection</b><br>
      <button id="detect-patterns">Detect Patterns</button>
      <ul id="pattern-list" style="max-height:8em;overflow:auto;"></ul>
    `;
    document.body.appendChild(patternPanel);
  }

  function detectPatterns() {
    // Example: Detect isolated nodes (no edges)
    const isolated = mindMap.nodes.filter(n => !mindMap.edges.some(e => e.from === n.id || e.to === n.id));
    // Example: Detect cycles (very basic, not efficient for large graphs)
    const cycles = [];
    function dfs(nodeId, visited, stack) {
      if (stack.includes(nodeId)) { cycles.push([...stack, nodeId]); return; }
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      mindMap.edges.filter(e => e.from === nodeId).forEach(e => dfs(e.to, visited, [...stack, nodeId]));
    }
    mindMap.nodes.forEach(n => dfs(n.id, new Set(), []));
    // Example: Detect nodes with too many edges (possible anti-pattern)
    const hubNodes = mindMap.nodes.filter(n => mindMap.edges.filter(e => e.from === n.id || e.to === n.id).length > 5);
    // Example: Detect duplicate labels
    const labelCounts = {};
    mindMap.nodes.forEach(n => { labelCounts[n.label] = (labelCounts[n.label] || 0) + 1; });
    const duplicates = Object.entries(labelCounts).filter(([l,c]) => c > 1).map(([l]) => l);
    // Highlight detected nodes
    mindMap.nodes.forEach(n => { n._pattern = null; });
    isolated.forEach(n => { n._pattern = 'isolated'; });
    hubNodes.forEach(n => { n._pattern = 'hub'; });
    mindMap.nodes.forEach(n => { if (duplicates.includes(n.label)) n._pattern = 'duplicate'; });
    // List patterns
    const patternList = document.getElementById('pattern-list');
    patternList.innerHTML = '';
    if (isolated.length) patternList.innerHTML += `<li><b>Isolated nodes:</b> ${isolated.map(n => n.label).join(', ')}</li>`;
    if (cycles.length) patternList.innerHTML += `<li><b>Cycles detected:</b> ${cycles.map(c => c.join('→')).join('; ')}</li>`;
    if (hubNodes.length) patternList.innerHTML += `<li><b>Hub nodes (&gt;5 edges):</b> ${hubNodes.map(n => n.label).join(', ')}</li>`;
    if (duplicates.length) patternList.innerHTML += `<li><b>Duplicate labels:</b> ${duplicates.join(', ')}</li>`;
    if (!isolated.length && !cycles.length && !hubNodes.length && !duplicates.length) patternList.innerHTML = '<li>No patterns or anti-patterns detected.</li>';
    renderMindMap();
  }

  document.getElementById('detect-patterns').onclick = detectPatterns;

  // Expose for renderNodes.js to highlight patterns
  return { detectPatterns };
}
