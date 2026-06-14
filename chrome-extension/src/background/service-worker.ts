chrome.runtime.onInstalled.addListener(() => {
  console.log("JobTrackr extension installed");
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) {
    console.log("API key updated");
  }
});
