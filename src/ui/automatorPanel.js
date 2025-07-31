
/**
 * Automator Panel UI script: wires up all UI controls and VS Code messaging.
 * Adds robust error handling and documentation for maintainability.
 */
const vscode = acquireVsCodeApi();
const dialogue = document.getElementById('dialogue');

/**
 * Helper to safely get an element by ID and cast to HTMLElement.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getEl(id) {
    return document.getElementById(id);
}

/**
 * Adds a dialogue message to the panel.
 * @param {string} text
 */
function addDialogue(text) {
    if (!dialogue) return;
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'transition-opacity duration-300 opacity-0';
    dialogue.appendChild(div);
    setTimeout(() => { div.className = 'transition-opacity duration-300 opacity-100'; }, 10);
    dialogue.scrollTop = dialogue.scrollHeight;
}

// Button event wiring with error handling
const buttonMap = [
    ['mapUITextAreaBtn', 'mapUITextArea', 'Map UI Text Area'],
    ['manageMappingsBtn', 'manageUITextAreaMappings', 'Manage UI Mappings'],
    ['exportMappingsBtn', 'exportUITextAreaMappings', 'Export UI Mappings'],
    ['importMappingsBtn', 'importUITextAreaMappings', 'Import UI Mappings'],
    ['suggestMappingsBtn', 'suggestChatMappings', 'Suggest Chat Mappings'],
    ['goBtn', 'start', 'Go'],
    ['pauseBtn', 'pause', 'Pause'],
    ['resumeBtn', 'resume', 'Resume'],
    ['stopBtn', 'stop', 'Stop'],
    ['settingsBtn', 'openSettings', 'Open Settings'],
    ['selectFilesBtn', 'selectFiles', 'Select Files for Review'],
    ['specResourcesBtn', 'manageSpecResources', 'Manage Specification Resources'],
    ['runInstructionBtn', 'runInstructionFile', 'Run Instruction File'],
    ['logViewerBtn', 'openLogViewer', 'View Logs']
];
for (const [btnId, command, label] of buttonMap) {
    const btn = getEl(btnId);
    if (btn) {
        btn.onclick = () => {
            vscode.postMessage({ command });
            addDialogue('User: ' + label);
        };
    }
}

const commandForm = getEl('commandForm');
if (commandForm) {
    commandForm.onsubmit = (e) => {
        e.preventDefault();
        const cmdInput = getEl('commandInput');
        if (cmdInput && cmdInput.value) {
            vscode.postMessage({ command: 'sendCommand', value: cmdInput.value });
            addDialogue('User: ' + cmdInput.value);
            cmdInput.value = '';
        }
    };
}

window.addEventListener('message', event => {
    if (event.data && event.data.type === 'dialogue') {
        addDialogue(event.data.text);
    }
});
