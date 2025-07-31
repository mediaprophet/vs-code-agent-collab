module.exports = function(api) {
  api.registerCommand('eventDemo.hello', () => {
    api.vscode.window.showInformationMessage('Hello from Event Demo Plugin!');
  });
  api.onEvent('mindmapUpdated', () => {
    api.vscode.window.showInformationMessage('Mindmap was updated (event demo).');
  });
  api.vscode.window.showInformationMessage('Event Demo Plugin loaded!');
};
