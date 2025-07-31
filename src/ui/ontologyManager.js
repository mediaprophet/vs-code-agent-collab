const vscode = acquireVsCodeApi();

// Add Ontology
const uploadForm = document.getElementById('uploadOntologyForm');
const uploadStatus = document.getElementById('uploadStatus');
uploadForm.onsubmit = (e) => {
  e.preventDefault();
  const file = document.getElementById('ontologyFile').files[0];
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

// Create Ontology
const createForm = document.getElementById('createOntologyForm');
const createStatus = document.getElementById('createStatus');
createForm.onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('ontologyName').value.trim();
  const description = document.getElementById('ontologyDescription').value.trim();
  if (!name) {
    createStatus.textContent = 'Ontology name is required.';
    return;
  }
  vscode.postMessage({ command: 'createOntology', name, description });
  createStatus.textContent = 'Creating ontology...';
};

// Convert Ontology
const convertForm = document.getElementById('convertOntologyForm');
const convertStatus = document.getElementById('convertStatus');
convertForm.onsubmit = (e) => {
  e.preventDefault();
  const file = document.getElementById('convertOntologyFile').files[0];
  const targetFormat = document.getElementById('targetFormat').value;
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

// Listen for messages from extension
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'ontologyList') {
    const list = document.getElementById('ontologyList');
    list.innerHTML = '';
    (msg.ontologies || []).forEach(o => {
      const li = document.createElement('li');
      li.textContent = o.name + (o.description ? `: ${o.description}` : '');
      list.appendChild(li);
    });
  } else if (msg.command === 'uploadStatus') {
    uploadStatus.textContent = msg.status;
  } else if (msg.command === 'createStatus') {
    createStatus.textContent = msg.status;
  } else if (msg.command === 'convertStatus') {
    convertStatus.textContent = msg.status;
  }
});
