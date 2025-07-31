
/**
 * Namespaces management UI script for semantic web panel.
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

const nsDiv = getEl('namespaces');
if (nsDiv) {
  nsDiv.innerHTML = `
    <h2>Manage Namespaces</h2>
    <form id="addNamespaceForm">
    <input type="text" id="prefix" placeholder="Prefix (e.g. foaf)" required />
    <input type="text" id="uri" placeholder="Namespace URI (e.g. http://xmlns.com/foaf/0.1/)" required />
    <button type="submit">Add Namespace</button>
    </form>
    <ul id="namespaceList"></ul>
  `;
  const nsList = getEl('namespaceList');
  const nsForm = getEl('addNamespaceForm');
  let namespaces = [];
  function renderNamespaces() {
    if (!nsList) return;
    nsList.innerHTML = namespaces.length ? namespaces.map((ns, i) => `<li>${ns.prefix}: <a href="${ns.uri}" target="_blank">${ns.uri}</a> <button data-i="${i}" class="removeNs">Remove</button></li>`).join('') : '<li>No namespaces defined.</li>';
  }
  if (nsForm) {
    nsForm.onsubmit = function(e) {
      e.preventDefault();
      namespaces.push({ prefix: nsForm.prefix.value, uri: nsForm.uri.value });
      nsForm.prefix.value = '';
      nsForm.uri.value = '';
      renderNamespaces();
    };
  }
  if (nsList) {
    nsList.onclick = function(e) {
      if (e.target.classList && e.target.classList.contains('removeNs')) {
        namespaces.splice(e.target.dataset.i, 1);
        renderNamespaces();
      }
    };
  }
  renderNamespaces();
}
