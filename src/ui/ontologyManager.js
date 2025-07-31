
/**
 * Ontology Manager UI script: wires up forms for upload, create, and convert ontology.
 * Adds robust error handling and documentation for maintainability.
 */
const vscode = acquireVsCodeApi();

/**
 * Helper to safely get an element by ID and cast to HTMLElement.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getEl(id) {
  return document.getElementById(id);
}

// Add Ontology
const uploadForm = getEl('uploadOntologyForm');
const uploadStatus = getEl('uploadStatus');
if (uploadForm) {
  uploadForm.onsubmit = (e) => {
    e.preventDefault();
    const fileInput = getEl('ontologyFile');
    if (!fileInput || !uploadStatus) return;
    const file = fileInput.files[0];
    if (!file) {
      uploadStatus.textContent = 'Please select a file.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      vscode.postMessage({ command: 'uploadOntology', name: file.name, content: reader.result });
      uploadStatus.textContent = 'Uploading...';
    };
    reader.readAsText(file);
  };
}

// Create Ontology
const createForm = getEl('createOntologyForm');
const createStatus = getEl('createStatus');
if (createForm) {
  createForm.onsubmit = (e) => {
    e.preventDefault();
    const nameInput = getEl('ontologyName');
    const descInput = getEl('ontologyDescription');
    if (!nameInput || !createStatus) return;
    const name = nameInput.value.trim();
    const description = descInput ? descInput.value.trim() : '';
    if (!name) {
      createStatus.textContent = 'Ontology name is required.';
      return;
    }
    vscode.postMessage({ command: 'createOntology', name, description });
    createStatus.textContent = 'Creating ontology...';
  };
}

// Convert Ontology
const convertForm = getEl('convertOntologyForm');
const convertStatus = getEl('convertStatus');
if (convertForm) {
  convertForm.onsubmit = (e) => {
    e.preventDefault();
    const fileInput = getEl('convertOntologyFile');
    const targetFormatInput = getEl('targetFormat');
    if (!fileInput || !targetFormatInput || !convertStatus) return;
    const file = fileInput.files[0];
    const targetFormat = targetFormatInput.value;
    if (!file) {
      convertStatus.textContent = 'Please select a file to convert.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      vscode.postMessage({ command: 'convertOntology', name: file.name, content: reader.result, targetFormat });
      convertStatus.textContent = 'Converting...';
    };
    reader.readAsText(file);
  };
}

// Listen for messages from extension
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'ontologyList') {
    const list = getEl('ontologyList');
    if (!list) return;
    list.innerHTML = '';
    (msg.ontologies || []).forEach(o => {
      const li = document.createElement('li');
      li.textContent = o.name + (o.description ? `: ${o.description}` : '');
      list.appendChild(li);
    });
  } else if (msg.command === 'uploadStatus') {
    if (uploadStatus) uploadStatus.textContent = msg.status;
  } else if (msg.command === 'createStatus') {
    if (createStatus) createStatus.textContent = msg.status;
  } else if (msg.command === 'convertStatus') {
    if (convertStatus) convertStatus.textContent = msg.status;
  }
});
