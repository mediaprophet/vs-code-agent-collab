// events.js
// General event listeners for mindmap

export function setupGeneralEvents() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') window.mindmapUndo && window.mindmapUndo();
    if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) window.mindmapRedo && window.mindmapRedo();
  });
}
