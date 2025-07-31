// Ontology & Mappings UI
const ontDiv = document.getElementById('ontology');
ontDiv.innerHTML = `
  <h2>Ontology Structures & Mappings</h2>
  <div>
    <button id="loadOntologyBtn">Load Ontology</button>
    <input type="file" id="ontologyFile" style="display:none;" />
    <div id="ontologyTree"></div>
  </div>
  <div id="mappingSection" style="margin-top:2em;">
    <h3>Mappings (sameAs, etc.)</h3>
    <button id="addMappingBtn">Add Mapping</button>
    <ul id="mappingList"></ul>
  </div>
`;
document.getElementById('loadOntologyBtn').onclick = function() {
  document.getElementById('ontologyFile').click();
};
document.getElementById('ontologyFile').onchange = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    // TODO: Parse and display ontology structure
    document.getElementById('ontologyTree').textContent = 'Ontology loaded (structure display pending backend integration).';
  };
  reader.readAsText(file);
};
const mappingList = document.getElementById('mappingList');
document.getElementById('addMappingBtn').onclick = function() {
  const mapping = prompt('Enter mapping (e.g. ex:foo owl:sameAs ex:bar):');
  if (mapping) {
    const li = document.createElement('li');
    li.textContent = mapping;
    mappingList.appendChild(li);
  }
};
