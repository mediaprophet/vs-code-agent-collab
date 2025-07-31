
/**
 * Ontology & Mappings UI script for semantic web panel.
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

const ontDiv = getEl('ontology');
if (ontDiv) {
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
  const loadBtn = getEl('loadOntologyBtn');
  const fileInput = getEl('ontologyFile');
  const treeDiv = getEl('ontologyTree');
  if (loadBtn && fileInput) {
    loadBtn.onclick = function() {
      fileInput.click();
    };
    fileInput.onchange = function(e) {
      const file = e.target.files[0];
      if (!file || !treeDiv) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        // TODO: Parse and display ontology structure
        treeDiv.textContent = 'Ontology loaded (structure display pending backend integration).';
      };
      reader.readAsText(file);
    };
  }
  const mappingList = getEl('mappingList');
  const addMappingBtn = getEl('addMappingBtn');
  if (addMappingBtn && mappingList) {
    addMappingBtn.onclick = function() {
      const mapping = prompt('Enter mapping (e.g. ex:foo owl:sameAs ex:bar):');
      if (mapping) {
        const li = document.createElement('li');
        li.textContent = mapping;
        mappingList.appendChild(li);
      }
    };
  }
}
