module.exports = function register(api) {
  // Demonstrate API access: register a panel and log a message
  api.registerPanel('ApiDemoPanel', {
    title: 'API Demo Panel',
    render: (container) => {
      container.innerHTML = '<h2>API Access Demo</h2><p>This panel was registered by a plugin.</p>';
    }
  });
  if (api.vscode && api.context) {
    api.vscode.window.showInformationMessage('Sample API Plugin loaded!');
  }
};
