
/**
 * Main entry point for MindMap Ontology UI.
 * Wires together all modular helpers and manages global state.
 * All helpers are imported from ./functions/ for maintainability and AI-friendliness.
 *
 * @module mindmap
 */

import { setupLLMAssist } from './functions/llmAssist.js';
import { applyForceDirectedLayout, applyRadialLayout, applyHierarchicalLayout } from './functions/graphLayouts.js';
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

/**
 * @typedef {Object} MindMap
 * @property {Array<Object>} nodes
 * @property {Array<Object>} edges
 */

/** @type {MindMap} */
let mindMap = { nodes: [], edges: [] };
/** @type {?string} */
let selectedNodeId = null;
/** @type {Set<string>} */
let selectedNodeIds = new Set();
/** @type {Array<string>} */
const NODE_TYPES = ['class', 'property', 'individual', 'relation', 'note'];
/** @type {HTMLElement} */
const canvas = document.getElementById('mindmap-canvas');
/** @type {HTMLElement} */
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
setupLLMAssist(mindMap);

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

// --- Auto Layout Button ---
const autoLayoutBtn = document.getElementById('auto-layout-btn');
if (autoLayoutBtn) {
  autoLayoutBtn.onclick = () => {
    applyForceDirectedLayout(mindMap);
    pushHistory();
    renderMindMap();
  };
}

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

/**
 * Main render function for the mindmap canvas.
 * Renders all nodes and edges, applies styles, and manages selection.
 */
function renderMindMap() {
  canvas.innerHTML = '';
  renderEdges(mindMap, canvas);
  renderNodes(
    mindMap,
    canvas,
    panZoom.zoom,
    panZoom.panX,
    panZoom.panY,
    selectedNodeId,
    selectedNodeIds,
    NODE_TYPES,
    enableInlineEditing,
    pushHistory,
    renderMindMap,
    showNodeDetails
  );
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
/**
 * Exports the current mindmap as a JSON string for reasoning/ontology tools.
 * @returns {string}
 */
function exportOntologyData() { return JSON.stringify(mindMap); }
setupReasoningIntegration(exportOntologyData);
