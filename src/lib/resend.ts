import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const client = getResend();
  const from = process.env.RESEND_FROM_EMAIL ?? "JobTrackr <onboarding@resend.dev>";

  if (!client) {
    console.log("[email:fallback]", { to, subject, replyTo, from });
    return { id: "dev-fallback" };
  }

  const result = await client.emails.send({
    from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: "Reset your JobTrackr password",
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  };
}

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to JobTrackr",
    html: `
      <h2>Welcome to JobTrackr, ${name}!</h2>
      <p>Start tracking your job applications, upload resumes, and let AI help you land your dream job.</p>
    `,
  };
}
