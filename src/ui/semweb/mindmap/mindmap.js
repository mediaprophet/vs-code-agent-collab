const autoLayoutBtn = document.getElementById('auto-layout-btn');
if (autoLayoutBtn) {
  autoLayoutBtn.onclick = () => {
    // Prefer force-directed, but could be replaced with LLM/AI call
    applyForceDirectedLayout(mindMap);
    pushHistory();
    renderMindMap();
  };
}
import { setupLLMAssist } from './functions/llmAssist.js';
// --- LLM Assistance ---
setupLLMAssist(mindMap);
import { applyForceDirectedLayout, applyRadialLayout, applyHierarchicalLayout } from './functions/graphLayouts.js';
// --- Graph Layout Controls ---
const layoutSelect = document.getElementById('layout-select');
const applyLayoutBtn = document.getElementById('apply-layout');
if (layoutSelect && applyLayoutBtn) {
  applyLayoutBtn.onclick = () => {
    if (layoutSelect.value === 'force') {
      applyForceDirectedLayout(mindMap);
    } else if (layoutSelect.value === 'radial') {
      applyRadialLayout(mindMap);
    } else if (layoutSelect.value === 'hierarchical') {
      applyHierarchicalLayout(mindMap);
    }
    pushHistory();
    renderMindMap();
  };
}
import { enableInlineEditing, enableTypeEditing } from './functions/inlineEditing.js';
import { setupReasoningIntegration } from './functions/reasoningIntegration.js';
import { showNodeDetails } from './functions/nodeDetails.js';
import { createHistoryManager } from './functions/history.js';
import { createPanZoom } from './functions/panZoom.js';
import { setupThemeToggle } from './functions/theme.js';
import { setupPalette } from './functions/palette.js';
import { setupBulkOps } from './functions/bulkOps.js';
import { setupMetadata } from './functions/metadata.js';
import { setupVersioning } from './functions/versioning.js';
import { setupValidation } from './functions/validation.js';
import { setupTemplates } from './functions/templates.js';
import { setupImportExport } from './functions/importExport.js';
import { setupGeneralEvents } from './functions/events.js';
import { renderNodes } from './functions/renderNodes.js';
import { renderEdges } from './functions/renderEdges.js';


// --- Mindmap State ---
let mindMap = { nodes: [], edges: [] };
let selectedNodeId = null;
let selectedNodeIds = new Set();
const NODE_TYPES = ['class', 'property', 'individual', 'relation', 'note'];
const canvas = document.getElementById('mindmap-canvas');
const nodeDetails = document.getElementById('node-details');

// --- Modularized Setup ---
const { pushHistory, undo, redo } = createHistoryManager(mindMap, renderMindMap);
const panZoom = createPanZoom(canvas, renderMindMap);
const getTheme = setupThemeToggle(renderMindMap);
setupPalette(canvas, NODE_TYPES, mindMap, pushHistory, renderMindMap);
setupBulkOps(canvas, mindMap, selectedNodeIds, pushHistory, renderMindMap, nodeDetails);
setupMetadata(mindMap);
setupVersioning(mindMap, renderMindMap);
setupValidation(mindMap);
setupTemplates(mindMap, renderMindMap);
setupImportExport(mindMap, renderMindMap);
setupGeneralEvents();

// --- Add Node Button Handler ---
const addNodeBtn = document.getElementById('add-node');
if (addNodeBtn) {
  addNodeBtn.onclick = () => {
    const label = prompt('Node label?');
    if (label) {
      const type = prompt('Node type? (class, property, individual, relation, note)', 'class') || 'class';
      const node = { id: Date.now().toString(), label, type };
      mindMap.nodes.push(node);
      pushHistory();
      renderMindMap();
    }
  };
}

// --- Main Render Function ---
function renderMindMap() {
  canvas.innerHTML = '';
  renderEdges(mindMap, canvas);
  renderNodes(mindMap, canvas, panZoom.zoom, panZoom.panX, panZoom.panY, selectedNodeId, selectedNodeIds, NODE_TYPES, enableInlineEditing, pushHistory, renderMindMap, showNodeDetails);
  // Set canvas to relative for absolute positioning
  canvas.style.position = 'relative';
  canvas.style.minHeight = '400px';
  canvas.style.overflow = 'hidden';
  // Add bulk-selected style
  const style = document.getElementById('mindmap-bulk-style') || document.createElement('style');
  style.id = 'mindmap-bulk-style';
  style.textContent = `.bulk-selected { outline: 2px solid #f90 !important; background: #ffe7b3 !important; }`;
  document.head.appendChild(style);
}

// --- Reasoning Integration ---
function exportOntologyData() { return JSON.stringify(mindMap); }
setupReasoningIntegration(exportOntologyData);
