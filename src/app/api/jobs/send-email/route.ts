import { NextRequest } from "next/server";
import { Receiver } from "@upstash/qstash";
import { sendEmail } from "@/lib/resend";
import type { SendEmailJob } from "@/lib/queue";
import { apiSuccess, apiError } from "@/lib/api";

async function verifyQStash(request: NextRequest, body: string) {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!currentKey) return true;

  const receiver = new Receiver({
    currentSigningKey: currentKey,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
  });

  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  return receiver.verify({ signature, body });
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const verified = await verifyQStash(request, bodyText);
  if (!verified) return apiError("Invalid signature", 401);

  const payload = JSON.parse(bodyText) as SendEmailJob;
  await sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  return apiSuccess({ sent: true });
}
