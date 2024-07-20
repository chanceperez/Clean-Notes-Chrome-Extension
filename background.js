async function setSidePanel() {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
  
  setSidePanel();
  