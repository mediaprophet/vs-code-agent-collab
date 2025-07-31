
/**
 * SPARQL query UI script for semantic web panel.
 * Adds robust error handling and maintainability improvements.
 */

/**
 * Helper to safely get an element by ID and cast to HTMLElement.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getEl(id) {
  return document.getElementById(id);
}

const sparqlDiv = getEl('sparql');
if (sparqlDiv) {
  sparqlDiv.innerHTML = `
    <h2>SPARQL Query</h2>
    <form id="sparqlForm">
    <textarea id="sparqlQuery" style="width:100%;height:120px;font-family:monospace;line-height:1.4;" placeholder="Enter SPARQL query here..."></textarea><br>
    <button type="submit">Run Query</button>
    </form>
    <pre id="sparqlResult" style="background:#222;color:#eee;padding:1em;overflow:auto;min-height:80px;"></pre>
  `;
  const sparqlForm = getEl('sparqlForm');
  const sparqlResult = getEl('sparqlResult');
  const sparqlQuery = getEl('sparqlQuery');
  if (sparqlQuery) {
    // Add line numbers (future enhancement)
    sparqlQuery.style.counterReset = 'line';
    sparqlQuery.oninput = function() {
      // No-op for now, could add a gutter for line numbers if needed
    };
  }
  if (sparqlForm && sparqlResult) {
    sparqlForm.onsubmit = function(e) {
      e.preventDefault();
      sparqlResult.textContent = 'Query submitted (backend integration needed)...';
      // TODO: Integrate with backend for real SPARQL execution
    };
  }
}
