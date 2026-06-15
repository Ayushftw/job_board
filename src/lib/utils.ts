import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "jt_";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export function extractEmailFromText(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function truncateForEmailUrl(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

export function buildMailtoUrl(to: string, subject: string, body: string) {
  const trimmedBody = truncateForEmailUrl(body, 1200);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmedBody)}`;
}

export function buildGmailComposeUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");
  params.set("to", to);
  params.set("su", subject);
  params.set("body", truncateForEmailUrl(body, 8000));
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function buildOutlookComposeUrl(to: string, subject: string, body: string) {
  const trimmedBody = truncateForEmailUrl(body, 8000);
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmedBody)}`;
}

export type EmailComposeProvider = "gmail" | "outlook" | "mailto";

export function buildEmailComposeUrl(
  provider: EmailComposeProvider,
  to: string,
  subject: string,
  body: string
) {
  if (provider === "gmail") return buildGmailComposeUrl(to, subject, body);
  if (provider === "outlook") return buildOutlookComposeUrl(to, subject, body);
  return buildMailtoUrl(to, subject, body);
}

export function openEmailCompose(url: string) {
  if (url.startsWith("mailto:")) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
}

export function isResendDomainError(message: string) {
  return /verify a domain|testing emails to your own email/i.test(message);
}

export function plainTextToHtml(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}
