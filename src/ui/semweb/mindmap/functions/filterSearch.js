// filterSearch.js
// Filtering and search logic for mindmap

export function setupFilterSearch(mindMap, renderMindMap, NODE_TYPES) {
  const searchInput = document.getElementById('mindmap-search');
  const typeFilter = document.getElementById('mindmap-type-filter');
  const groupFilter = document.getElementById('mindmap-group-filter');
  let lastFilter = { search: '', type: '', group: '' };

  function filterNodes() {
    const search = (searchInput && searchInput.value.trim().toLowerCase()) || '';
    const type = (typeFilter && typeFilter.value) || '';
    const group = (groupFilter && groupFilter.value) || '';
    lastFilter = { search, type, group };
    mindMap.nodes.forEach(n => {
      let match = true;
      if (search && !(n.label.toLowerCase().includes(search) || (n.annotation||'').toLowerCase().includes(search))) match = false;
      if (type && n.type !== type) match = false;
      if (group && n.group !== group) match = false;
      n._filtered = !match;
    });
    renderMindMap();
  }

  if (searchInput) searchInput.oninput = filterNodes;
  if (typeFilter) typeFilter.onchange = filterNodes;
  if (groupFilter) groupFilter.onchange = filterNodes;

  // Populate type filter
  if (typeFilter) {
    typeFilter.innerHTML = '<option value="">All Types</option>' + NODE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
  }
  // Populate group filter
  if (groupFilter) {
    const groups = Array.from(new Set(mindMap.nodes.map(n => n.group).filter(Boolean)));
    groupFilter.innerHTML = '<option value="">All Groups</option>' + groups.map(g => `<option value="${g}">${g}</option>`).join('');
  }

  // Expose for manual refresh (e.g., after group changes)
  return { refreshGroupFilter: () => {
    if (groupFilter) {
      const groups = Array.from(new Set(mindMap.nodes.map(n => n.group).filter(Boolean)));
      groupFilter.innerHTML = '<option value="">All Groups</option>' + groups.map(g => `<option value="${g}">${g}</option>`).join('');
    }
  }};
}

// In renderNodes.js, skip rendering nodes with n._filtered === true
