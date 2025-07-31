// theme.js
// Theming logic for mindmap

export function setupThemeToggle(renderMindMap) {
  let theme = 'light';
  const themeToggle = document.createElement('button');
  themeToggle.textContent = 'Toggle Theme';
  themeToggle.onclick = () => {
    theme = theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'dark' ? '#222' : '#fff';
    document.body.style.color = theme === 'dark' ? '#eee' : '#222';
    renderMindMap();
  };
  document.body.insertBefore(themeToggle, document.body.firstChild);
  return () => theme;
}
