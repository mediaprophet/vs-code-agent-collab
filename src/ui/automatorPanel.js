const vscode = acquireVsCodeApi();
const dialogue = document.getElementById('dialogue');

document.getElementById('mapUITextAreaBtn').onclick = () => {
    vscode.postMessage({ command: 'mapUITextArea' });
    addDialogue('User: Map UI Text Area');
};
document.getElementById('manageMappingsBtn').onclick = () => {
    vscode.postMessage({ command: 'manageUITextAreaMappings' });
    addDialogue('User: Manage UI Mappings');
};
document.getElementById('exportMappingsBtn').onclick = () => {
    vscode.postMessage({ command: 'exportUITextAreaMappings' });
    addDialogue('User: Export UI Mappings');
};
document.getElementById('importMappingsBtn').onclick = () => {
    vscode.postMessage({ command: 'importUITextAreaMappings' });
    addDialogue('User: Import UI Mappings');
};
document.getElementById('suggestMappingsBtn').onclick = () => {
    vscode.postMessage({ command: 'suggestChatMappings' });
    addDialogue('User: Suggest Chat Mappings');
};
document.getElementById('goBtn').onclick = () => {
    vscode.postMessage({ command: 'start' });
    addDialogue('User: Go');
};
document.getElementById('pauseBtn').onclick = () => {
    vscode.postMessage({ command: 'pause' });
    addDialogue('User: Pause');
};
document.getElementById('resumeBtn').onclick = () => {
    vscode.postMessage({ command: 'resume' });
    addDialogue('User: Resume');
};
document.getElementById('stopBtn').onclick = () => {
    vscode.postMessage({ command: 'stop' });
    addDialogue('User: Stop');
};
document.getElementById('settingsBtn').onclick = () => {
    vscode.postMessage({ command: 'openSettings' });
    addDialogue('User: Open Settings');
};
document.getElementById('selectFilesBtn').onclick = () => {
    vscode.postMessage({ command: 'selectFiles' });
    addDialogue('User: Select Files for Review');
};
document.getElementById('specResourcesBtn').onclick = () => {
    vscode.postMessage({ command: 'manageSpecResources' });
    addDialogue('User: Manage Specification Resources');
};
document.getElementById('runInstructionBtn').onclick = () => {
    vscode.postMessage({ command: 'runInstructionFile' });
    addDialogue('User: Run Instruction File');
};
document.getElementById('logViewerBtn').onclick = () => {
    vscode.postMessage({ command: 'openLogViewer' });
    addDialogue('User: View Logs');
};
document.getElementById('commandForm').onsubmit = (e) => {
    e.preventDefault();
    const cmd = document.getElementById('commandInput').value;
    if (cmd) {
        vscode.postMessage({ command: 'sendCommand', value: cmd });
        addDialogue('User: ' + cmd);
        document.getElementById('commandInput').value = '';
    }
};
window.addEventListener('message', event => {
    if (event.data && event.data.type === 'dialogue') {
        addDialogue(event.data.text);
    }
});
function addDialogue(text) {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'transition-opacity duration-300 opacity-0';
    dialogue.appendChild(div);
    setTimeout(() => { div.className = 'transition-opacity duration-300 opacity-100'; }, 10);
    dialogue.scrollTop = dialogue.scrollHeight;
}
