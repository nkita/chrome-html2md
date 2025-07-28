// Handle messages from popup
chrome.runtime.onMessage.addListener((message) => {
  try {
    switch (message.action) {
      case "startScreenSelection":
        handleScreenSelection(message.tabId);
        break;
      case "openSettings":
        handleSettings();
        break;
      default:
        console.warn("Unknown message action:", message.action);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

// Handle screen selection functionality (current script injection logic)
function handleScreenSelection(tabId) {
  try {
    // Get tab information to check if it's a restricted page
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting tab information:", chrome.runtime.lastError);
        return;
      }
      
      // Check for restricted pages
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com")) {
        console.warn("Cannot inject scripts on restricted pages:", tab.url);
        return;
      }
      
      // Execute the script injection (current functionality)
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["turndown.js", "content.js"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error injecting scripts:", chrome.runtime.lastError);
        }
      });
    });
  } catch (error) {
    console.error("Error in handleScreenSelection:", error);
  }
}

// Placeholder for future settings functionality
function handleSettings() {
  try {
    // Placeholder implementation - settings not yet implemented
    console.log("Settings functionality not yet implemented");
    // Future implementation will handle settings interface
  } catch (error) {
    console.error("Error in handleSettings:", error);
  }
}
