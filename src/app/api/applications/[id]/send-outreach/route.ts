import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { sendOutreachSchema } from "@/dto/ai.dto";
import { applicationService } from "@/services/application.service";
import { applicationRepository } from "@/repositories/application.repository";
import { userRepository } from "@/repositories/user.repository";
import { aiMessageRepository, activityRepository } from "@/repositories/activity.repository";
import { sendEmail } from "@/lib/resend";
import { plainTextToHtml } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

async function recordOutreach(
  userId: string,
  applicationId: string,
  input: { to: string; subject: string; body: string },
  channel: "resend" | "mailto"
) {
  const app = await applicationRepository.findById(applicationId, userId);
  if (!app) throw new Error("Not found");

  await aiMessageRepository.create({
    userId,
    applicationId,
    type: "OUTREACH",
    content: JSON.stringify({
      to: input.to,
      subject: input.subject,
      body: input.body,
      channel,
    }),
  });

  if (!app.recruiterEmail || app.recruiterEmail !== input.to) {
    await applicationRepository.update(applicationId, userId, {
      recruiterEmail: input.to,
    });
  }

  await applicationService.updateStatus(applicationId, userId, "APPLIED");

  await activityRepository.create({
    userId,
    applicationId,
    action: channel === "mailto" ? "OUTREACH_SENT_MAILTO" : "OUTREACH_SENT",
    metadata: {
      to: input.to,
      subject: input.subject,
      company: app.company,
      role: app.role,
      channel,
    },
  });

  return { sent: true, status: "APPLIED", channel };
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  return withApiHandler(request, async (userId) => {
    const body = await request.json();
    const input = sendOutreachSchema.parse(body);

    if (input.viaMailto) {
      return recordOutreach(userId, id, input, "mailto");
    }

    const user = await userRepository.findById(userId);
    if (!user?.email) throw new Error("User email not found");

    await sendEmail({
      to: input.to,
      subject: input.subject,
      html: plainTextToHtml(input.body),
      replyTo: user.email,
    });

    return recordOutreach(userId, id, input, "resend");
  });
}
