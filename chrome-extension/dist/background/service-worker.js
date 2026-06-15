chrome.runtime.onInstalled.addListener(()=>{console.log("JobTrackr extension installed")});chrome.storage.onChanged.addListener(e=>{e.apiKey&&console.log("API key updated")});
