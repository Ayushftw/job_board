import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { activityService } from "@/services/activity.service";
import { analyticsService } from "@/services/analytics.service";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.endsWith("/activity")) {
    return withApiHandler(request, async (userId) => {
      const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
      return activityService.getRecent(userId, limit);
    });
  }

  return withApiHandler(request, async (userId) => {
    const full = request.nextUrl.searchParams.get("full") === "true";
    if (full) return analyticsService.getFullAnalytics(userId);
    return analyticsService.getDashboardStats(userId);
  });
}
