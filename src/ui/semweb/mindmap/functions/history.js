// history.js
// Undo/redo state management for mindmap

export function createHistoryManager(mindMap, renderMindMap) {
  let history = [], future = [];
  function pushHistory() {
    history.push(JSON.stringify(mindMap));
    if (history.length > 50) history.shift();
    future = [];
  }
  function undo() {
    if (history.length > 0) {
      future.push(JSON.stringify(mindMap));
      Object.assign(mindMap, JSON.parse(history.pop()));
      renderMindMap();
    }
  }
  function redo() {
    if (future.length > 0) {
      history.push(JSON.stringify(mindMap));
      Object.assign(mindMap, JSON.parse(future.pop()));
      renderMindMap();
    }
  }
  return { pushHistory, undo, redo };
}
