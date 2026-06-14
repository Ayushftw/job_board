import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

export function getAIRateLimit() {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "ratelimit:ai",
  });
}

export function getAPIRateLimit() {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "ratelimit:api",
  });
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number }> {
  if (!limiter) return { success: true };
  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
