// validation.js
// Ontology validation integration

export function setupValidation(mindMap) {
  const validateBtn = document.getElementById('validate-ontology');
  const validationStatus = document.getElementById('validation-status');
  if (validateBtn && validationStatus) {
    validateBtn.onclick = () => {
      validationStatus.textContent = 'Validating...';
      vscode.postMessage({ command: 'validateOntology', mindMap });
    };
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'ontologyValidationResult') {
        validationStatus.textContent = msg.status;
        validationStatus.style.color = msg.valid ? '#090' : '#c00';
      }
    });
  }
}
