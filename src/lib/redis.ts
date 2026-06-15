import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const client = getRedis();
  if (client) {
    const cached = await client.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  }

  const data = await fetchFn();

  if (client) {
    await client.set(key, data, { ex: ttlSeconds });
  }

  return data;
}

export async function invalidateCache(key: string) {
  const client = getRedis();
  if (client) {
    await client.del(key);
  }
}

export async function invalidateCachePattern(pattern: string) {
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.warn("[redis] invalidateCachePattern failed:", pattern, error);
  }
}
