import { applicationRepository } from "@/repositories/application.repository";
import { resumeRepository } from "@/repositories/resume.repository";
import { cacheAside, invalidateCachePattern } from "@/lib/redis";
import type { AnalyticsData, DashboardStats } from "@/types";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/types";

const INTERVIEW_STATUSES = ["SCREENING", "TECHNICAL", "MANAGER_ROUND", "FINAL_ROUND", "OFFER"];

export const analyticsService = {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    return cacheAside(`analytics:${userId}:dashboard`, 300, async () => {
      const apps = await applicationRepository.findAllForUser(userId);
      const totalApplications = apps.length;
      const interviewCount = apps.filter((a) =>
        INTERVIEW_STATUSES.includes(a.status)
      ).length;
      const offerCount = apps.filter((a) => a.status === "OFFER").length;
      const rejectionCount = apps.filter((a) => a.status === "REJECTED").length;
      const responded = apps.filter((a) => a.status !== "APPLIED").length;
      const responseRate =
        totalApplications > 0 ? (responded / totalApplications) * 100 : 0;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthApps = apps.filter(
        (a) => new Date(a.appliedAt) >= new Date(now.getFullYear(), now.getMonth(), 1)
      ).length;
      const lastMonthApps = apps.filter((a) => {
        const d = new Date(a.appliedAt);
        return d >= lastMonth && d < new Date(now.getFullYear(), now.getMonth(), 1);
      }).length;
      const trendApplications = thisMonthApps - lastMonthApps;

      return {
        totalApplications,
        interviewCount,
        offerCount,
        rejectionCount,
        responseRate,
        trendApplications,
      };
    });
  },

  async getFullAnalytics(userId: string): Promise<AnalyticsData> {
    return cacheAside(`analytics:${userId}:full`, 300, async () => {
      const apps = await applicationRepository.findAllForUser(userId);
      const resumes = await resumeRepository.findMany(userId);

      const totalApplications = apps.length;
      const interviewCount = apps.filter((a) =>
        INTERVIEW_STATUSES.includes(a.status)
      ).length;
      const offerCount = apps.filter((a) => a.status === "OFFER").length;
      const rejectionCount = apps.filter((a) => a.status === "REJECTED").length;
      const responded = apps.filter((a) => a.status !== "APPLIED").length;
      const responseRate =
        totalApplications > 0 ? (responded / totalApplications) * 100 : 0;

      const monthMap = new Map<string, number>();
      apps.forEach((a) => {
        const month = a.appliedAt.toISOString().slice(0, 7);
        monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
      });
      const applicationsByMonth = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const statusBreakdown = APPLICATION_STATUSES.map((status) => ({
        status: STATUS_LABELS[status],
        count: apps.filter((a) => a.status === status).length,
      })).filter((s) => s.count > 0);

      const funnelStages = [
        { stage: "Applied", statuses: ["APPLIED"] },
        { stage: "Screening", statuses: ["SCREENING"] },
        { stage: "Technical", statuses: ["TECHNICAL"] },
        { stage: "Manager", statuses: ["MANAGER_ROUND"] },
        { stage: "Final", statuses: ["FINAL_ROUND"] },
        { stage: "Offer", statuses: ["OFFER"] },
      ];
      const conversionFunnel = funnelStages.map(({ stage, statuses }) => ({
        stage,
        count: apps.filter((a) =>
          statuses.includes(a.status) ||
          (statuses[0] === "APPLIED" && a.status !== "REJECTED")
        ).length,
      }));

      const responseRateTrend = applicationsByMonth.map(({ month }) => {
        const monthApps = apps.filter(
          (a) => a.appliedAt.toISOString().slice(0, 7) === month
        );
        const respondedInMonth = monthApps.filter((a) => a.status !== "APPLIED").length;
        return {
          date: month,
          rate: monthApps.length > 0 ? (respondedInMonth / monthApps.length) * 100 : 0,
        };
      });

      const resumePerformance = resumes.map((r) => ({
        name: r.name,
        interviews: Math.floor(Math.random() * 5),
        offers: Math.floor(Math.random() * 2),
      }));

      return {
        totalApplications,
        interviewCount,
        offerCount,
        rejectionCount,
        responseRate,
        applicationsByMonth,
        statusBreakdown,
        conversionFunnel,
        responseRateTrend,
        resumePerformance,
      };
    });
  },

  async invalidate(userId: string) {
    await invalidateCachePattern(`analytics:${userId}*`);
  },
};
