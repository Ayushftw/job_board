export interface LinkedInJobData {
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  jobDescription: string;
  employmentType: string;
}

export function scrapeLinkedInJob(): LinkedInJobData | null {
  try {
    const role =
      document.querySelector(".job-details-jobs-unified-top-card__job-title h1")?.textContent?.trim() ??
      document.querySelector("h1.t-24")?.textContent?.trim() ??
      "";

    const company =
      document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() ??
      document.querySelector(".job-details-jobs-unified-top-card__primary-description-container a")?.textContent?.trim() ??
      "";

    const location =
      document.querySelector(".job-details-jobs-unified-top-card__bullet")?.textContent?.trim() ??
      document.querySelector(".job-details-jobs-unified-top-card__primary-description-container")?.textContent?.trim() ??
      "";

    const employmentType =
      document.querySelector(".job-details-jobs-unified-top-card__job-insight")?.textContent?.trim() ??
      "Full-time";

    const descriptionEl =
      document.querySelector(".jobs-description__content") ??
      document.querySelector("#job-details") ??
      document.querySelector(".jobs-box__html-content");

    const jobDescription = descriptionEl?.textContent?.trim() ?? "";

    if (!role || !company) return null;

    return {
      company,
      role,
      location,
      jobUrl: window.location.href.split("?")[0],
      jobDescription,
      employmentType,
    };
  } catch {
    return null;
  }
}

// Store scraped data for popup access
const job = scrapeLinkedInJob();
if (job) {
  chrome.storage.local.set({ scrapedJob: job });
}
