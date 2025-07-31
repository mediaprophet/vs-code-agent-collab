// reasoningUI.js
// Handles dynamic engine/profile listing and UI selection for reasoning engines

/**
 * Populate the reasoning engine and profile dropdowns in the UI.
 * @param {ToolsSystem} toolsSystem - The tools system instance
 */
export function populateReasoningUI(toolsSystem) {
    const engineSelect = document.getElementById('engine-select');
    const profileSelect = document.getElementById('profile-select');
    if (!engineSelect || !profileSelect) return;

    // Clear existing options
    engineSelect.innerHTML = '<option value="">-- Select Engine --</option>';
    profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';

    // List all registered reasoning engines
    const engines = toolsSystem.list('reasoner');
    engines.forEach(engineName => {
        const opt = document.createElement('option');
        opt.value = engineName;
        opt.textContent = engineName;
        engineSelect.appendChild(opt);
    });

    // When engine changes, update profiles (stub: just one profile per engine for now)
    engineSelect.onchange = () => {
        const selected = engineSelect.value;
        profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';
        if (selected) {
            // In a real implementation, fetch supported profiles from the engine
            const opt = document.createElement('option');
            opt.value = 'default';
            opt.textContent = 'default';
            profileSelect.appendChild(opt);
        }
    };
}
