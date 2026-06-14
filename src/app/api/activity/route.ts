import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { activityService } from "@/services/activity.service";

export async function GET(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
    return activityService.getRecent(userId, limit);
  });
}
