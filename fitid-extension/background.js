// FitID — background service worker (Edge / Chrome MV3)
chrome.runtime.onInstalled.addListener((d) => {
  if (d.reason === 'install') chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'fitid:openOptions') chrome.runtime.openOptionsPage();
});
