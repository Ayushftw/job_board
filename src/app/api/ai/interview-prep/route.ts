import { NextRequest } from "next/server";
import { withApiHandler, apiError } from "@/lib/api";
import { aiService } from "@/services/match.service";
import { interviewPrepSchema } from "@/dto/ai.dto";
import { getAIRateLimit, checkRateLimit } from "@/lib/ratelimit";
import { getAuthUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return apiError("Unauthorized", 401);

  const rateLimit = getAIRateLimit();
  const { success } = await checkRateLimit(rateLimit, userId);
  if (!success) return apiError("Rate limit exceeded", 429);

  return withApiHandler(request, async (uid) => {
    const body = await request.json();
    const input = interviewPrepSchema.parse(body);
    return aiService.generateInterviewPrep(uid, input.applicationId);
  });
}
