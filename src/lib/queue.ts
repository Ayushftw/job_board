import { Client } from "@upstash/qstash";

let qstash: Client | null = null;

export function getQStash(): Client | null {
  if (!process.env.QSTASH_TOKEN) return null;
  if (!qstash) {
    qstash = new Client({ token: process.env.QSTASH_TOKEN });
  }
  return qstash;
}

export type JobType = "parse-resume" | "send-email";

export interface ParseResumeJob {
  type: "parse-resume";
  resumeId: string;
  fileUrl: string;
}

export interface SendEmailJob {
  type: "send-email";
  to: string;
  subject: string;
  html: string;
}

export type JobPayload = ParseResumeJob | SendEmailJob;

export async function enqueueJob(payload: JobPayload) {
  const client = getQStash();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const endpoint = `${baseUrl}/api/jobs/${payload.type}`;

  if (client) {
    await client.publishJSON({
      url: endpoint,
      body: payload,
      retries: 3,
    });
    return { queued: true };
  }

  // Fallback: direct fetch for local dev without QStash
  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { queued: false, direct: true };
}
