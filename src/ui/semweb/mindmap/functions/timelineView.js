// timelineView.js
// Timeline/history panel for mindmap with support for temporal n-dimensionalities

export function setupTimelineView(mindMap, historyManager, renderMindMap) {
  let timelinePanel = document.getElementById('mindmap-timeline-panel');
  if (!timelinePanel) {
    timelinePanel = document.createElement('div');
    timelinePanel.id = 'mindmap-timeline-panel';
    timelinePanel.style.position = 'absolute';
    timelinePanel.style.left = '50%';
    timelinePanel.style.bottom = '20px';
    timelinePanel.style.transform = 'translateX(-50%)';
    timelinePanel.style.background = '#fff';
    timelinePanel.style.border = '1px solid #aaa';
    timelinePanel.style.padding = '0.5em 1em';
    timelinePanel.style.zIndex = 10;
    timelinePanel.style.fontSize = '0.95em';
    timelinePanel.innerHTML = `
      <b>Timeline View</b><br>
      <input type="range" id="timeline-slider" min="0" max="0" value="0" style="width:200px;" />
      <span id="timeline-label">0/0</span>
      <button id="timeline-prev">Prev</button>
      <button id="timeline-next">Next</button>
      <select id="timeline-dimension"></select>
    `;
    document.body.appendChild(timelinePanel);
  }

  // Support for temporal n-dimensionalities
  // Each node/edge can have a .timeline property: { [dimension]: [ {t, ...props} ] }
  // The UI allows selecting a dimension and navigating its timeline

  function getDimensions() {
    const dims = new Set();
    mindMap.nodes.forEach(n => {
      if (n.timeline) Object.keys(n.timeline).forEach(d => dims.add(d));
    });
    mindMap.edges.forEach(e => {
      if (e.timeline) Object.keys(e.timeline).forEach(d => dims.add(d));
    });
    return Array.from(dims);
  }

  function updateDimensionOptions() {
    const dimSel = document.getElementById('timeline-dimension');
    const dims = getDimensions();
    dimSel.innerHTML = dims.length ? dims.map(d => `<option value="${d}">${d}</option>`).join('') : '<option value="default">default</option>';
  }

  function getTimelineLength(dimension) {
    // Find max timeline length for the selected dimension
    let max = 0;
    mindMap.nodes.forEach(n => {
      if (n.timeline && n.timeline[dimension]) max = Math.max(max, n.timeline[dimension].length);
    });
    mindMap.edges.forEach(e => {
      if (e.timeline && e.timeline[dimension]) max = Math.max(max, e.timeline[dimension].length);
    });
    return max;
  }

  function setTimelineStep(dimension, step) {
    // For each node/edge, set properties to those at the given step in the selected dimension
    mindMap.nodes.forEach(n => {
      if (n.timeline && n.timeline[dimension] && n.timeline[dimension][step]) {
        Object.assign(n, n.timeline[dimension][step]);
      }
    });
    mindMap.edges.forEach(e => {
      if (e.timeline && e.timeline[dimension] && e.timeline[dimension][step]) {
        Object.assign(e, e.timeline[dimension][step]);
      }
    });
    renderMindMap();
  }

  function updateTimelineUI() {
    const dimSel = document.getElementById('timeline-dimension');
    const slider = document.getElementById('timeline-slider');
    const label = document.getElementById('timeline-label');
    const dimension = dimSel.value || 'default';
    const len = getTimelineLength(dimension);
    slider.max = Math.max(0, len - 1);
    slider.value = slider.value > slider.max ? slider.max : slider.value;
    label.textContent = `${Number(slider.value) + 1}/${len}`;
  }

  updateDimensionOptions();
  updateTimelineUI();

  document.getElementById('timeline-dimension').onchange = () => {
    updateTimelineUI();
    setTimelineStep(document.getElementById('timeline-dimension').value, Number(document.getElementById('timeline-slider').value));
  };
  document.getElementById('timeline-slider').oninput = () => {
    setTimelineStep(document.getElementById('timeline-dimension').value, Number(document.getElementById('timeline-slider').value));
    updateTimelineUI();
  };
  document.getElementById('timeline-prev').onclick = () => {
    const slider = document.getElementById('timeline-slider');
    slider.value = Math.max(0, Number(slider.value) - 1);
    slider.dispatchEvent(new Event('input'));
  };
  document.getElementById('timeline-next').onclick = () => {
    const slider = document.getElementById('timeline-slider');
    slider.value = Math.min(Number(slider.max), Number(slider.value) + 1);
    slider.dispatchEvent(new Event('input'));
  };

  // Expose update for external calls (e.g., after data changes)
  return { updateTimelineUI, updateDimensionOptions };
}
