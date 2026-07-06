// Quickchat Widget Simulation Loader Script
(function() {
  window.QuickchatWidgetConfig = {
    scenarioId: "da01a00a-60d7-41ec-b827-8178cd3bf084", // Oracle's ID
    name: "Oracle",
    theme: "amber"
  };

  // Create root element for mounting the React widget portal
  if (!document.getElementById('quickchat-widget-root')) {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'quickchat-widget-root';
    document.body.appendChild(rootDiv);
  }

  // Dispatch event indicating loader is ready
  const event = new CustomEvent('quickchat-widget-ready', {
    detail: window.QuickchatWidgetConfig
  });
  window.dispatchEvent(event);
})();
