// graphLayouts.js
// Provides automatic graph layout algorithms for the mindmap

export function applyForceDirectedLayout(mindMap, width = 800, height = 600, iterations = 200) {
  // Simple force-directed layout (Fruchterman-Reingold inspired)
  const nodes = mindMap.nodes;
  const edges = mindMap.edges;
  const area = width * height;
  const k = Math.sqrt(area / (nodes.length + 1));
  const repulsion = 0.75;
  const attraction = 0.1;
  // Initialize positions if missing
  nodes.forEach(n => {
    if (typeof n.x !== 'number') n.x = Math.random() * width;
    if (typeof n.y !== 'number') n.y = Math.random() * height;
  });
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate repulsive forces
    nodes.forEach(v => {
      v.dx = 0; v.dy = 0;
      nodes.forEach(u => {
        if (u !== v) {
          let dx = v.x - u.x;
          let dy = v.y - u.y;
          let dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
          let force = (k * k) / dist * repulsion;
          v.dx += (dx / dist) * force;
          v.dy += (dy / dist) * force;
        }
      });
    });
    // Calculate attractive forces
    edges.forEach(e => {
      const source = nodes.find(n => n.id === e.from);
      const target = nodes.find(n => n.id === e.to);
      if (source && target) {
        let dx = source.x - target.x;
        let dy = source.y - target.y;
        let dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        let force = (dist * dist) / k * attraction;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        source.dx -= fx;
        source.dy -= fy;
        target.dx += fx;
        target.dy += fy;
      }
    });
    // Update positions
    nodes.forEach(n => {
      n.x += Math.max(-10, Math.min(10, n.dx));
      n.y += Math.max(-10, Math.min(10, n.dy));
      // Keep within bounds
      n.x = Math.max(20, Math.min(width - 20, n.x));
      n.y = Math.max(20, Math.min(height - 20, n.y));
    });
  }
}

export function applyRadialLayout(mindMap, centerX = 400, centerY = 300, radius = 200) {
  const nodes = mindMap.nodes;
  const angleStep = (2 * Math.PI) / nodes.length;
  nodes.forEach((n, i) => {
    n.x = centerX + radius * Math.cos(i * angleStep);
    n.y = centerY + radius * Math.sin(i * angleStep);
  });
}

export function applyHierarchicalLayout(mindMap, startX = 100, startY = 100, xStep = 180, yStep = 100) {
  // Simple top-down layout: arrange nodes by depth
  const nodes = mindMap.nodes;
  const edges = mindMap.edges;
  // Find roots (nodes with no incoming edges)
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const incoming = {};
  edges.forEach(e => { incoming[e.to] = true; });
  const roots = nodes.filter(n => !incoming[n.id]);
  let y = startY;
  function layoutLevel(levelNodes, x) {
    levelNodes.forEach((n, i) => {
      n.x = x;
      n.y = y + i * yStep;
      // Find children
      const children = edges.filter(e => e.from === n.id).map(e => nodeMap[e.to]);
      if (children.length) layoutLevel(children, x + xStep);
    });
  }
  layoutLevel(roots, startX);
}
