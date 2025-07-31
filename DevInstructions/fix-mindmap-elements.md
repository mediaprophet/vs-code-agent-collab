# Fixing mindmap.js and mindmapOntology.ts: Cleanup and Refactor Instructions

## Problem
- `mindmap.js` has become bloated, contains duplicate and broken code blocks, and references undefined variables (e.g., `newNode`).
- There are multiple or misplaced declarations of `mindMap` and rendering logic, causing runtime errors like `Cannot read properties of undefined (reading 'length')`.
- The backend file `mindmapOntology.ts` is duplicated in the same file and may have redundant imports.

## Solution Steps

### 1. mindmap.js Cleanup
- Ensure there is only one declaration of `let mindMap = { nodes: [], edges: [] };` near the top of the file.
- Remove any lines like `pushHistory(); mindMap.nodes.push(newNode);` that reference `newNode` outside of a function.
- Remove any duplicate or misplaced node rendering loops at the end of the file.
- The only place that should render nodes is inside the `renderMindMap()` function.
- The only place that should add nodes is the `add-node` button handler, which should:
  ```js
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
  ```
- Make sure all code referencing `mindMap.nodes` or `mindMap.edges` is after the declaration.
- Remove any code that is not inside a function or event handler and references `mindMap` or its properties.
- Only import and use helpers (e.g., `enableInlineEditing`) as needed.

### 2. mindmapOntology.ts Cleanup
- Remove duplicate import statements (e.g., `import * as fs from 'fs/promises';` and `import * as path from 'path';` should only appear once).
- Remove duplicate interface and function definitions.
- Ensure only one export per function or interface.
- Keep only one version of the file, with all logic in a single, clean block.

### 3. General
- After cleanup, test the mindmap UI for node creation, editing, and all ontology management features.
- Ensure the file is small and modular, with helpers in `functions/` as needed.

---

**Summary:**
- Remove all duplicate, broken, or misplaced code in both files.
- Ensure only one declaration and usage of each variable, function, and import.
- Keep logic modular and maintainable for AI agents and future development.
