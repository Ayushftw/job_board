import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

interface JobData {
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  employmentType: string;
  jobDescription?: string;
  recruiterName?: string;
  recruiterEmail?: string;
}

function Popup() {
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("http://localhost:3000");
  const [job, setJob] = useState<JobData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(true);

  const scrapeCurrentTab = useCallback(async () => {
    setScanning(true);
    setMessage("");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.includes("linkedin.com/jobs/view/")) {
      setJob(null);
      setMessage("Open a LinkedIn job page (/jobs/view/...) first");
      setScanning(false);
      return;
    }

    let scraped: JobData | null = null;

    // Try content script message first
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "scrapeJob" });
      if (response?.job) scraped = response.job;
    } catch {
      // Content script not loaded — inject scraper directly into page
    }

    if (!scraped) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            function parseTitle(title: string) {
              const hiring = title.match(/^(.+?) hiring (.+?) in (.+?) \| LinkedIn$/i);
              if (hiring) {
                return {
                  company: hiring[1].trim(),
                  role: hiring[2].trim(),
                  location: hiring[3].trim(),
                };
              }
              const pipe = title.match(/^(.+?) \| (.+?) \| LinkedIn$/i);
              if (pipe) {
                return { role: pipe[1].trim(), company: pipe[2].trim(), location: "" };
              }
              return null;
            }

            function getDescription() {
              const desc =
                document.querySelector(".jobs-description__content") ??
                document.querySelector("#job-details") ??
                document.querySelector(".jobs-description-content__text") ??
                document.querySelector(".jobs-box__html-content");
              return desc?.textContent?.trim().slice(0, 15000) ?? "";
            }

            const fromTitle = parseTitle(document.title);
            if (fromTitle?.company && fromTitle?.role) {
              return {
                company: fromTitle.company,
                role: fromTitle.role,
                location: fromTitle.location ?? "",
                jobUrl: location.href.split("?")[0],
                employmentType: "Full-time",
                jobDescription: getDescription(),
              };
            }

            const role =
              document.querySelector(".job-details-jobs-unified-top-card__job-title h1")?.textContent?.trim() ??
              document.querySelector(".jobs-unified-top-card__job-title h1")?.textContent?.trim() ??
              document.querySelector("main h1")?.textContent?.trim() ??
              document.querySelector("h1")?.textContent?.trim() ??
              "";

            let company =
              document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() ??
              document.querySelector(".jobs-unified-top-card__company-name a")?.textContent?.trim() ??
              "";

            let locationText =
              document.querySelector(".job-details-jobs-unified-top-card__bullet")?.textContent?.trim() ??
              document.querySelector(".jobs-unified-top-card__bullet")?.textContent?.trim() ??
              "";

            if (!company || !locationText) {
              const topCard = document.querySelector(
                ".jobs-unified-top-card__primary-description, .job-details-jobs-unified-top-card__primary-description-container"
              );
              const text = topCard?.textContent?.replace(/\s+/g, " ").trim() ?? "";
              const parts = text.split("·").map((p) => p.trim()).filter(Boolean);
              if (!company && parts[0]) company = parts[0];
              if (!locationText && parts.length > 1) locationText = parts.slice(1).join(", ");
            }

            if (!company || !locationText) {
              const h1 = document.querySelector("h1");
              const block = h1?.closest("section, article, main") ?? h1?.parentElement;
              const blockText = block?.textContent?.replace(/\s+/g, " ").trim() ?? "";
              const afterRole = role ? blockText.replace(role, "").trim() : blockText;
              const companyMatch = afterRole.match(/^([A-Z0-9&][A-Za-z0-9&.\- ]+?)\s{2,}([A-Za-z].+)$/);
              if (companyMatch) {
                if (!company) company = companyMatch[1].trim();
                if (!locationText) locationText = companyMatch[2].trim();
              }
            }

            if (!role || !company) return null;

            return {
              company,
              role,
              location: locationText,
              jobUrl: location.href.split("?")[0],
              employmentType: "Full-time",
              jobDescription: getDescription(),
            };
          },
        });
        if (result?.result) scraped = result.result as JobData;
      } catch {
        setMessage("Could not read this page. Refresh LinkedIn and try again.");
      }
    }

    if (scraped) {
      setJob(scraped);
      await chrome.storage.local.set({ scrapedJob: scraped });
    } else {
      setJob(null);
      setMessage((prev) => prev || "Could not detect job details. Refresh the LinkedIn page.");
    }

    setScanning(false);
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["apiKey", "apiUrl", "scrapedJob"], (result) => {
      if (result.apiKey) setApiKey(result.apiKey);
      if (result.apiUrl) setApiUrl(result.apiUrl);
      if (result.scrapedJob) setJob(result.scrapedJob);
    });
    scrapeCurrentTab();
  }, [scrapeCurrentTab]);

  function saveSettings() {
    chrome.storage.local.set({ apiKey, apiUrl });
    setMessage("Settings saved!");
  }

  async function importJob() {
    if (!apiKey || !job) return;
    chrome.storage.local.set({ apiKey, apiUrl });
    setStatus("loading");
    try {
      const res = await fetch(`${apiUrl}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          company: job.company,
          role: job.role,
          location: job.location,
          jobUrl: job.jobUrl,
          employmentType: job.employmentType,
          jobDescription: job.jobDescription ?? "",
          recruiterName: job.recruiterName ?? "",
          recruiterEmail: job.recruiterEmail ?? "",
        }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("Job imported successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(data.error ?? "Import failed. Check your API key.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Is JobTrackr running at " + apiUrl + "?");
    }
  }

  const canImport = !!job && !!apiKey && status !== "loading";
  const importHint = !scanning
    ? !job
      ? "Open a LinkedIn job page and click Refresh"
      : !apiKey
        ? "Job detected — paste API key from JobTrackr Settings"
        : ""
    : "";

  return (
    <div style={{ width: 320, padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, background: "#6366f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 12 }}>JT</div>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>JobTrackr Import</h1>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#71717a" }}>API URL</label>
        <input
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#71717a" }}>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="jt_..."
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
        />
      </div>

      <button
        onClick={saveSettings}
        style={{ width: "100%", padding: "8px", background: "#f4f4f5", border: "none", borderRadius: 6, cursor: "pointer", marginBottom: 12, fontSize: 13 }}
      >
        Save Settings
      </button>

      {scanning ? (
        <p style={{ color: "#71717a", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Scanning page...</p>
      ) : job ? (
        <div style={{ background: "#f4f4f5", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: 14 }}>{job.role}</p>
          <p style={{ color: "#71717a", margin: "0 0 4px", fontSize: 13 }}>{job.company}</p>
          <p style={{ color: "#71717a", margin: 0, fontSize: 12 }}>{job.location}</p>
        </div>
      ) : (
        <p style={{ color: "#71717a", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
          No job detected on this page
        </p>
      )}

      <button
        onClick={scrapeCurrentTab}
        style={{ width: "100%", padding: "8px", background: "#f4f4f5", border: "none", borderRadius: 6, cursor: "pointer", marginBottom: 8, fontSize: 13 }}
      >
        Refresh job from page
      </button>

      <button
        onClick={importJob}
        disabled={!canImport}
        style={{
          width: "100%",
          padding: "10px",
          background: canImport ? "#6366f1" : "#e4e4e7",
          color: canImport ? "white" : "#71717a",
          border: "none",
          borderRadius: 6,
          cursor: canImport ? "pointer" : "not-allowed",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {status === "loading" ? "Importing..." : "Import Job"}
      </button>

      {!canImport && importHint && (
        <p style={{ marginTop: 8, fontSize: 12, textAlign: "center", color: "#71717a" }}>
          {importHint}
        </p>
      )}

      {message && (
        <p style={{
          marginTop: 12,
          fontSize: 13,
          textAlign: "center",
          color: status === "success" ? "#16a34a" : status === "error" ? "#ef4444" : "#71717a",
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
