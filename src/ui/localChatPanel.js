const vscode = acquireVsCodeApi();
const chat = document.getElementById('chat');
const loading = document.getElementById('loading');
let lastModelDiv = null;

document.getElementById('chatForm').onsubmit = function(e) {
    e.preventDefault();
    var prompt = document.getElementById('prompt').value.trim();
    if (!prompt) return;
    vscode.postMessage({ command: 'sendPrompt', prompt: prompt });
    document.getElementById('prompt').value = '';
    chat.innerHTML += '<div class="mb-1"><span class="font-semibold text-gray-700">You:</span> ' + prompt + '</div>';
    lastModelDiv = document.createElement('div');
    lastModelDiv.className = 'mb-2';
    lastModelDiv.innerHTML = '<span class="font-semibold text-green-700">Model:</span> ';
    chat.appendChild(lastModelDiv);
    chat.scrollTop = chat.scrollHeight;
};
document.getElementById('clearBtn').onclick = function() {
    vscode.postMessage({ command: 'clearChat' });
};
window.addEventListener('message', function(event) {
    if (event.data.command === 'streamMessage') {
        if (lastModelDiv) {
            lastModelDiv.innerHTML = '<span class="font-semibold text-green-700">Model:</span> ' + event.data.response;
            chat.scrollTop = chat.scrollHeight;
        }
    } else if (event.data.command === 'loading') {
        loading.classList.remove('hidden');
    } else if (event.data.command === 'doneLoading') {
        loading.classList.add('hidden');
    } else if (event.data.command === 'clearChat') {
        chat.innerHTML = '';
        lastModelDiv = null;
    }
});
