export interface LinkedInJobData {
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  jobDescription: string;
  employmentType: string;
  recruiterName?: string;
  recruiterEmail?: string;
}

function extractEmailFromText(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match?.[0];
}

/** Parse LinkedIn tab title: "Company hiring Role in Location | LinkedIn" */
function parseFromTitle(title: string): Partial<LinkedInJobData> | null {
  const match = title.match(/^(.+?) hiring (.+?) in (.+?) \| LinkedIn$/i);
  if (!match) return null;
  return {
    company: match[1].trim(),
    role: match[2].trim(),
    location: match[3].trim(),
  };
}

export function scrapeLinkedInJob(doc: Document = document, url: string = location.href): LinkedInJobData | null {
  try {
    const fromTitle = parseFromTitle(doc.title);

    const role =
      doc.querySelector(".job-details-jobs-unified-top-card__job-title h1")?.textContent?.trim() ??
      doc.querySelector(".jobs-unified-top-card__job-title h1")?.textContent?.trim() ??
      doc.querySelector("h1.top-card-layout__title")?.textContent?.trim() ??
      doc.querySelector("main h1")?.textContent?.trim() ??
      doc.querySelector("h1")?.textContent?.trim() ??
      fromTitle?.role ??
      "";

    let company =
      doc.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() ??
      doc.querySelector(".jobs-unified-top-card__company-name a")?.textContent?.trim() ??
      doc.querySelector(".jobs-unified-top-card__subtitle-primary-grouping a")?.textContent?.trim() ??
      doc.querySelector(".topcard__org-name-link")?.textContent?.trim() ??
      fromTitle?.company ??
      "";

    let locationText =
      doc.querySelector(".job-details-jobs-unified-top-card__bullet")?.textContent?.trim() ??
      doc.querySelector(".jobs-unified-top-card__bullet")?.textContent?.trim() ??
      doc.querySelector(".jobs-unified-top-card__workplace-type")?.textContent?.trim() ??
      fromTitle?.location ??
      "";

    // Fallback: parse "Company  Location" line under h1
    if (!company || !locationText) {
      const topCard = doc.querySelector(".jobs-unified-top-card__primary-description, .job-details-jobs-unified-top-card__primary-description-container");
      const text = topCard?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (text && !company) {
        const parts = text.split("·").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 1) company = parts[0];
        if (parts.length >= 2) locationText = parts.slice(1).join(", ");
      }
    }

    const employmentType =
      doc.querySelector(".job-details-jobs-unified-top-card__job-insight")?.textContent?.trim() ??
      doc.querySelector(".jobs-unified-top-card__job-insight")?.textContent?.trim() ??
      "Full-time";

    const descriptionEl =
      doc.querySelector(".jobs-description__content") ??
      doc.querySelector("#job-details") ??
      doc.querySelector(".jobs-box__html-content") ??
      doc.querySelector(".jobs-description-content__text");

    const jobDescription = descriptionEl?.textContent?.trim().slice(0, 15000) ?? "";

    const recruiterName =
      doc.querySelector(".hirer-card__hirer-information .jobs-poster__name")?.textContent?.trim() ??
      doc.querySelector(".jobs-poster__name")?.textContent?.trim() ??
      doc.querySelector(".jobs-poster__headline")?.textContent?.trim() ??
      doc.querySelector(".jobs-unified-top-card__poster-name")?.textContent?.trim() ??
      "";

    const recruiterEmail = extractEmailFromText(jobDescription);

    const cleanRole = role.replace(/\s+/g, " ").trim();
    const cleanCompany = company.replace(/\s+/g, " ").trim();

    if (!cleanRole || !cleanCompany) return null;

    return {
      company: cleanCompany,
      role: cleanRole,
      location: locationText.replace(/\s+/g, " ").trim(),
      jobUrl: url.split("?")[0],
      jobDescription,
      employmentType: employmentType.replace(/\s+/g, " ").trim(),
      ...(recruiterName ? { recruiterName } : {}),
      ...(recruiterEmail ? { recruiterEmail } : {}),
    };
  } catch {
    return null;
  }
}

export function isLinkedInJobPage(url: string) {
  return /linkedin\.com\/jobs\/view\/\d+/i.test(url);
}
