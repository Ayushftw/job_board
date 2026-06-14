import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { usageMetricsRepository } from "@/repositories/activity.repository";
import { userRepository } from "@/repositories/user.repository";

export async function GET(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    const [metrics, user] = await Promise.all([
      usageMetricsRepository.getOrCreate(userId),
      userRepository.findById(userId),
    ]);
    return {
      ...metrics,
      apiKey: user?.apiKey,
      publicProfile: user?.publicProfile,
      username: user?.username,
    };
  });
}

export async function PATCH(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    const body = await request.json();
    const data: { publicProfile?: boolean; username?: string } = {};
    if (typeof body.publicProfile === "boolean") data.publicProfile = body.publicProfile;
    if (body.username) data.username = body.username;
    return userRepository.update(userId, data);
  });
}
