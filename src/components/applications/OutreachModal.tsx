"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildEmailComposeUrl, extractEmailFromText, isResendDomainError, openEmailCompose, type EmailComposeProvider } from "@/lib/utils";
import { toast } from "sonner";

type ModalState = "idle" | "drafting" | "review" | "sent" | "mailto_pending";

interface OutreachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  company: string;
  role: string;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  jobDescription?: string | null;
  onSent?: () => void;
}

export function OutreachModal({
  open,
  onOpenChange,
  applicationId,
  company,
  role,
  recruiterName,
  recruiterEmail,
  jobDescription,
  onSent,
}: OutreachModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [resumeId, setResumeId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const detected =
      recruiterEmail?.trim() ||
      extractEmailFromText(jobDescription ?? "") ||
      "";
    setTo(detected);
    setSubject("");
    setBody("");
    setState("idle");
    setSending(false);
    setSendError(null);

    fetch("/api/resumes")
      .then((res) => (res.ok ? res.json() : []))
      .then((resumes: Array<{ id: string; parseStatus: string; profile?: unknown }>) => {
        const parsed = resumes.find((r) => r.parseStatus === "DONE" && r.profile);
        if (parsed) setResumeId(parsed.id);
      })
      .catch(() => undefined);
  }, [open, recruiterEmail, jobDescription]);

  if (!open) return null;

  async function handleGenerateDraft() {
    if (!to.trim()) {
      toast.error("Enter a recipient email first");
      return;
    }

    setState("drafting");
    setSendError(null);
    try {
      const res = await fetch("/api/ai/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, resumeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate draft");

      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      setState("review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate draft");
      setState("idle");
    }
  }

  async function recordMailtoSent() {
    setSending(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/send-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          viaMailto: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update application");

      setState("sent");
      toast.success("Application marked as Applied");
      onSent?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update application");
    } finally {
      setSending(false);
    }
  }

  function handleOpenInEmailApp(provider: EmailComposeProvider) {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Fill in To, Subject, and Body first");
      return;
    }

    const url = buildEmailComposeUrl(provider, to.trim(), subject.trim(), body.trim());
    openEmailCompose(url);
    setState("mailto_pending");
    setSendError(null);

    if (provider === "gmail") {
      toast.success("Opening Gmail in a new tab");
    } else if (provider === "outlook") {
      toast.success("Opening Outlook in a new tab");
    } else {
      toast.success("Opening your default mail app");
    }
  }

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Fill in To, Subject, and Body before sending");
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/send-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");

      setState("sent");
      toast.success("Outreach email sent — application marked as Applied");
      onSent?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email";
      setSendError(message);
      if (isResendDomainError(message)) {
        toast.error("Use “Open in Email App” until you verify a domain on Resend");
      } else {
        toast.error(message);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Mail className="h-5 w-5 text-primary" />
              Send Outreach Email
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {role} at {company}
              {recruiterName ? ` · ${recruiterName}` : ""}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {state === "sent" ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              This application is now marked as <strong>Applied</strong>.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : state === "mailto_pending" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gmail or Outlook should open in a new tab with your message pre-filled. Review it and press <strong>Send</strong> from your inbox.
            </p>
            <p className="text-sm text-muted-foreground">
              If nothing opened, allow pop-ups for this site and try again:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant="outline" size="sm" onClick={() => handleOpenInEmailApp("gmail")}>
                Gmail
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleOpenInEmailApp("outlook")}>
                Outlook
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleOpenInEmailApp("mailto")}>
                Mail app
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              After you&apos;ve sent it, mark this application as Applied in JobTrackr.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setState("review")}>
                Back to edit
              </Button>
              <Button className="flex-1" onClick={recordMailtoSent} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "I've sent it — Mark as Applied"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outreach-to">To</Label>
              <Input
                id="outreach-to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recruiter@company.com"
                disabled={state === "drafting" || sending}
              />
              {!to && (
                <p className="text-xs text-muted-foreground">
                  No HR email found — enter the recruiter or hiring manager email manually.
                </p>
              )}
            </div>

            {(state === "review" || subject || body) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="outreach-subject">Subject</Label>
                  <Input
                    id="outreach-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={state === "drafting" || sending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outreach-body">Message</Label>
                  <Textarea
                    id="outreach-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    disabled={state === "drafting" || sending}
                  />
                </div>

                {sendError && isResendDomainError(sendError) && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Resend test mode limitation</p>
                    <p className="mt-1">
                      Without a verified domain, JobTrackr can only send to your own inbox via Resend.
                      Use <strong>Open in Email App</strong> to send from Gmail/Outlook instead, or verify a domain at{" "}
                      <a
                        href="https://resend.com/domains"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        resend.com/domains
                      </a>
                      .
                    </p>
                  </div>
                )}

                <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  Use <strong>Gmail</strong> or <strong>Outlook</strong> to compose in your browser (recommended on Windows).
                  <strong> Send via JobTrackr</strong> requires a verified Resend domain.
                </p>
              </>
            )}

            <div className="flex flex-col gap-2">
              {state === "idle" || state === "drafting" ? (
                <Button
                  className="w-full"
                  onClick={handleGenerateDraft}
                  disabled={state === "drafting"}
                >
                  {state === "drafting" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating draft...
                    </>
                  ) : (
                    "Generate AI Draft"
                  )}
                </Button>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenInEmailApp("gmail")}
                      disabled={sending}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Gmail
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenInEmailApp("outlook")}
                      disabled={sending}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Outlook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenInEmailApp("mailto")}
                      disabled={sending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Mail app
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSubject("");
                      setBody("");
                      setSendError(null);
                      setState("idle");
                    }}
                    disabled={sending}
                  >
                    Regenerate draft
                  </Button>
                  <Button className="w-full" onClick={handleSend} disabled={sending}>
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send via JobTrackr"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
