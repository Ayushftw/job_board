import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { matchService, aiService } from "@/services/match.service";
import { matchScoreSchema } from "@/dto/ai.dto";
import { getAIRateLimit, checkRateLimit } from "@/lib/ratelimit";
import { applicationRepository } from "@/repositories/application.repository";
import { apiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  const { getAuthUserId } = await import("@/lib/auth");
  const userId = await getAuthUserId(request);
  if (!userId) return apiError("Unauthorized", 401);

  const rateLimit = getAIRateLimit();
  const { success } = await checkRateLimit(rateLimit, userId);
  if (!success) return apiError("Rate limit exceeded", 429);

  return withApiHandler(request, async (uid) => {
    const body = await request.json();
    const input = matchScoreSchema.parse(body);

    let jobDescription = input.jobDescription;
    if (input.applicationId) {
      const app = await applicationRepository.findById(input.applicationId, uid);
      if (app?.jobDescription) jobDescription = app.jobDescription;
    }

    if (!jobDescription) throw new Error("Job description is required");

    return matchService.computeMatch(uid, input.resumeId, jobDescription, input.applicationId);
  });
}
