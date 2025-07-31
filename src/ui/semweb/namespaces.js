// Namespaces management UI
const nsDiv = document.getElementById('namespaces');
nsDiv.innerHTML = `
  <h2>Manage Namespaces</h2>
  <form id="addNamespaceForm">
    <input type="text" id="prefix" placeholder="Prefix (e.g. foaf)" required />
    <input type="text" id="uri" placeholder="Namespace URI (e.g. http://xmlns.com/foaf/0.1/)" required />
    <button type="submit">Add Namespace</button>
  </form>
  <ul id="namespaceList"></ul>
`;
const nsList = document.getElementById('namespaceList');
const nsForm = document.getElementById('addNamespaceForm');
let namespaces = [];
function renderNamespaces() {
  nsList.innerHTML = namespaces.length ? namespaces.map((ns, i) => `<li>${ns.prefix}: <a href="${ns.uri}" target="_blank">${ns.uri}</a> <button data-i="${i}" class="removeNs">Remove</button></li>`).join('') : '<li>No namespaces defined.</li>';
}
nsForm.onsubmit = function(e) {
  e.preventDefault();
  namespaces.push({ prefix: nsForm.prefix.value, uri: nsForm.uri.value });
  nsForm.prefix.value = '';
  nsForm.uri.value = '';
  renderNamespaces();
};
nsList.onclick = function(e) {
  if (e.target.classList.contains('removeNs')) {
    namespaces.splice(e.target.dataset.i, 1);
    renderNamespaces();
  }
};
renderNamespaces();
