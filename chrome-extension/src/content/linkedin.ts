import { scrapeLinkedInJob, isLinkedInJobPage } from "../lib/scrape";

function storeJob() {
  if (!isLinkedInJobPage(location.href)) return null;
  const job = scrapeLinkedInJob();
  if (job) chrome.storage.local.set({ scrapedJob: job });
  return job;
}

// Scrape on load (with retries for dynamic content)
storeJob();
setTimeout(storeJob, 1500);
setTimeout(storeJob, 4000);

// Re-scrape on SPA navigation
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    storeJob();
  }
});
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}

// Popup requests fresh scrape
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "scrapeJob") {
    const job = storeJob();
    sendResponse({ job, url: location.href });
    return true;
  }
});
