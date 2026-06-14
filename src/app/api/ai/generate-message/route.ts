import { NextRequest } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { aiService } from "@/services/match.service";
import { generateMessageSchema } from "@/dto/ai.dto";
import { getAIRateLimit, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return apiError("Unauthorized", 401);

  const rateLimit = getAIRateLimit();
  const { success } = await checkRateLimit(rateLimit, userId);
  if (!success) return apiError("Rate limit exceeded", 429);

  const body = await request.json();
  const input = generateMessageSchema.parse(body);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of aiService.generateMessageStream(userId, input)) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
