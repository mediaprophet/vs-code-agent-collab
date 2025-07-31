// statsPanel.js
// Statistics & metrics panel for mindmap

export function setupStatsPanel(mindMap, NODE_TYPES) {
  let statsPanel = document.getElementById('mindmap-stats-panel');
  if (!statsPanel) {
    statsPanel = document.createElement('div');
    statsPanel.id = 'mindmap-stats-panel';
    statsPanel.style.position = 'absolute';
    statsPanel.style.left = '20px';
    statsPanel.style.bottom = '20px';
    statsPanel.style.background = '#fff';
    statsPanel.style.border = '1px solid #aaa';
    statsPanel.style.padding = '0.5em 1em';
    statsPanel.style.zIndex = 10;
    statsPanel.style.fontSize = '0.95em';
    document.body.appendChild(statsPanel);
  }
  function updateStats() {
    const nodeCount = mindMap.nodes.length;
    const edgeCount = mindMap.edges.length;
    const typeCounts = {};
    NODE_TYPES.forEach(t => { typeCounts[t] = 0; });
    mindMap.nodes.forEach(n => { if (typeCounts[n.type] !== undefined) typeCounts[n.type]++; });
    const groupCounts = {};
    mindMap.nodes.forEach(n => { if (n.group) groupCounts[n.group] = (groupCounts[n.group] || 0) + 1; });
    statsPanel.innerHTML = `
      <b>Statistics</b><br>
      Nodes: <b>${nodeCount}</b><br>
      Edges: <b>${edgeCount}</b><br>
      <u>Types</u>:<br>
      ${NODE_TYPES.map(t => `${t}: <b>${typeCounts[t]}</b>`).join(' | ')}<br>
      <u>Groups</u>:<br>
      ${Object.entries(groupCounts).map(([g,c]) => `${g}: <b>${c}</b>`).join(' | ') || 'None'}
    `;
  }
  updateStats();
  return { updateStats };
}
