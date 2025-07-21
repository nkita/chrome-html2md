chrome.action.onClicked.addListener((tab) => {
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com")) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["turndown.js", "content.js"]
  });
});
