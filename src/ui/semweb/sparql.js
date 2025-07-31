// SPARQL query UI
const sparqlDiv = document.getElementById('sparql');
sparqlDiv.innerHTML = `
  <h2>SPARQL Query</h2>
  <form id="sparqlForm">
    <textarea id="sparqlQuery" style="width:100%;height:120px;font-family:monospace;line-height:1.4;" placeholder="Enter SPARQL query here..."></textarea><br>
    <button type="submit">Run Query</button>
  </form>
  <pre id="sparqlResult" style="background:#222;color:#eee;padding:1em;overflow:auto;min-height:80px;"></pre>
`;
const sparqlForm = document.getElementById('sparqlForm');
const sparqlResult = document.getElementById('sparqlResult');
const sparqlQuery = document.getElementById('sparqlQuery');
// Add line numbers
sparqlQuery.style.counterReset = 'line';
sparqlQuery.oninput = function() {
  // No-op for now, could add a gutter for line numbers if needed
};
sparqlForm.onsubmit = function(e) {
  e.preventDefault();
  sparqlResult.textContent = 'Query submitted (backend integration needed)...';
  // TODO: Integrate with backend for real SPARQL execution
};
