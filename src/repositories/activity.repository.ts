import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const activityRepository = {
  create(data: {
    userId: string;
    applicationId?: string;
    action: string;
    metadata?: Record<string, unknown>;
  }) {
    return db.activityLog.create({
      data: {
        userId: data.userId,
        applicationId: data.applicationId,
        action: data.action,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
      include: {
        application: { select: { company: true, role: true } },
      },
    });
  },

  findRecent(userId: string, limit = 20) {
    return db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        application: { select: { company: true, role: true, id: true } },
      },
    });
  },
};

export const usageMetricsRepository = {
  getOrCreate(userId: string) {
    return db.usageMetrics.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  },

  increment(userId: string, field: "totalApplications" | "totalResumes" | "totalAIRequests" | "totalMatchAnalyses", amount = 1) {
    return db.usageMetrics.upsert({
      where: { userId },
      create: {
        userId,
        [field]: amount,
      },
      update: {
        [field]: { increment: amount },
      },
    });
  },
};

export const interviewRepository = {
  create(applicationId: string, data: Prisma.InterviewCreateWithoutApplicationInput) {
    return db.interview.create({
      data: { ...data, applicationId },
    });
  },

  findByApplication(applicationId: string) {
    return db.interview.findMany({
      where: { applicationId },
      orderBy: { scheduledAt: "asc" },
    });
  },
};

export const aiMessageRepository = {
  create(data: {
    userId: string;
    applicationId?: string;
    type: "REFERRAL" | "FOLLOW_UP" | "OUTREACH" | "THANK_YOU";
    content: string;
  }) {
    return db.aIMessage.create({ data });
  },
};
