import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { aiService } from "@/services/match.service";
import { generateOutreachSchema } from "@/dto/ai.dto";
import { getAIRateLimit, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    const rateLimit = getAIRateLimit();
    const { success } = await checkRateLimit(rateLimit, userId);
    if (!success) throw new Error("Rate limit exceeded");

    const body = await request.json();
    const input = generateOutreachSchema.parse(body);
    return aiService.generateOutreachEmail(userId, input.applicationId, input.resumeId);
  });
}
