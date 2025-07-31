
/**
 * Local Chat Panel UI script: wires up chat form, clear button, and streaming model output.
 * Adds robust error handling and documentation for maintainability.
 */
const vscode = acquireVsCodeApi();
const chat = document.getElementById('chat');
const loading = document.getElementById('loading');
let lastModelDiv = null;

/**
 * Helper to safely get an element by ID and cast to HTMLElement.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getEl(id) {
    return document.getElementById(id);
}

const chatForm = getEl('chatForm');
if (chatForm) {
    chatForm.onsubmit = function(e) {
        e.preventDefault();
        const promptInput = getEl('prompt');
        if (!promptInput || !chat) return;
        var prompt = promptInput.value.trim();
        if (!prompt) return;
        vscode.postMessage({ command: 'sendPrompt', prompt: prompt });
        promptInput.value = '';
        chat.innerHTML += '<div class="mb-1"><span class="font-semibold text-gray-700">You:</span> ' + prompt + '</div>';
        lastModelDiv = document.createElement('div');
        lastModelDiv.className = 'mb-2';
        lastModelDiv.innerHTML = '<span class="font-semibold text-green-700">Model:</span> ';
        chat.appendChild(lastModelDiv);
        chat.scrollTop = chat.scrollHeight;
    };
}

const clearBtn = getEl('clearBtn');
if (clearBtn) {
    clearBtn.onclick = function() {
        vscode.postMessage({ command: 'clearChat' });
    };
}

window.addEventListener('message', function(event) {
    if (!chat || !loading) return;
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
