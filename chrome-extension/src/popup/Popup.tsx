import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface JobData {
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  employmentType: string;
}

function Popup() {
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("http://localhost:3000");
  const [job, setJob] = useState<JobData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["apiKey", "apiUrl", "scrapedJob"], (result) => {
      if (result.apiKey) setApiKey(result.apiKey);
      if (result.apiUrl) setApiUrl(result.apiUrl);
      if (result.scrapedJob) setJob(result.scrapedJob);
    });
  }, []);

  function saveSettings() {
    chrome.storage.local.set({ apiKey, apiUrl });
    setMessage("Settings saved!");
  }

  async function importJob() {
    if (!apiKey || !job) return;
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
          jobDescription: "",
        }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("Job imported successfully!");
      } else {
        setStatus("error");
        setMessage("Import failed. Check your API key.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Check API URL.");
    }
  }

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
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 13, marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#71717a" }}>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="jt_..."
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 13, marginTop: 4 }}
        />
      </div>

      <button
        onClick={saveSettings}
        style={{ width: "100%", padding: "8px", background: "#f4f4f5", border: "none", borderRadius: 6, cursor: "pointer", marginBottom: 12, fontSize: 13 }}
      >
        Save Settings
      </button>

      {job ? (
        <div style={{ background: "#f4f4f5", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: 14 }}>{job.role}</p>
          <p style={{ color: "#71717a", margin: "0 0 4px", fontSize: 13 }}>{job.company}</p>
          <p style={{ color: "#71717a", margin: 0, fontSize: 12 }}>{job.location}</p>
        </div>
      ) : (
        <p style={{ color: "#71717a", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
          Open a LinkedIn job page to import
        </p>
      )}

      <button
        onClick={importJob}
        disabled={!job || !apiKey || status === "loading"}
        style={{
          width: "100%",
          padding: "10px",
          background: job && apiKey ? "#6366f1" : "#e4e4e7",
          color: job && apiKey ? "white" : "#71717a",
          border: "none",
          borderRadius: 6,
          cursor: job && apiKey ? "pointer" : "not-allowed",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {status === "loading" ? "Importing..." : "Import Job"}
      </button>

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
