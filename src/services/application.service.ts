import bcrypt from "bcryptjs";
import { applicationRepository } from "@/repositories/application.repository";
import {
  activityRepository,
  usageMetricsRepository,
  interviewRepository,
} from "@/repositories/activity.repository";
import { userRepository } from "@/repositories/user.repository";
import { invalidateCache, invalidateCachePattern } from "@/lib/redis";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationQueryInput,
} from "@/dto/application.dto";
import type { ApplicationStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/types";
import { slugify, generateApiKey } from "@/lib/utils";
import { registerSchema } from "@/dto/auth.dto";
import { enqueueJob } from "@/lib/queue";
import { welcomeEmail } from "@/lib/resend";

export const applicationService = {
  async list(userId: string, query: ApplicationQueryInput) {
    const [items, total] = await Promise.all([
      applicationRepository.findMany(userId, query),
      applicationRepository.count(userId, {
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { company: { contains: query.search, mode: "insensitive" } },
                { role: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
      }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  },

  async getById(id: string, userId: string) {
    const app = await applicationRepository.findById(id, userId);
    if (!app) throw new Error("Not found");
    return app;
  },

  async create(userId: string, input: CreateApplicationInput) {
    const app = await applicationRepository.create(userId, {
      company: input.company,
      role: input.role,
      jobUrl: input.jobUrl || null,
      salary: input.salary || null,
      location: input.location || null,
      employmentType: input.employmentType || null,
      recruiterName: input.recruiterName || null,
      recruiterEmail: input.recruiterEmail || null,
      notes: input.notes || null,
      jobDescription: input.jobDescription || null,
      status: input.status ?? "SCREENING",
    });

    await activityRepository.create({
      userId,
      applicationId: app.id,
      action: "APPLICATION_CREATED",
      metadata: { company: app.company, role: app.role },
    });

    await usageMetricsRepository.increment(userId, "totalApplications");
    await invalidateCachePattern(`analytics:${userId}*`);
    return app;
  },

  async update(id: string, userId: string, input: UpdateApplicationInput) {
    const existing = await applicationRepository.findById(id, userId);
    if (!existing) throw new Error("Not found");

    await applicationRepository.update(id, userId, {
      ...input,
      jobUrl: input.jobUrl === "" ? null : input.jobUrl,
      recruiterEmail: input.recruiterEmail === "" ? null : input.recruiterEmail,
    });

    await invalidateCachePattern(`analytics:${userId}*`);
    return applicationRepository.findById(id, userId);
  },

  async delete(id: string, userId: string) {
    const existing = await applicationRepository.findById(id, userId);
    if (!existing) throw new Error("Not found");
    await applicationRepository.delete(id, userId);
    await invalidateCachePattern(`analytics:${userId}*`);
    return { success: true };
  },

  async updateStatus(id: string, userId: string, status: ApplicationStatus) {
    const existing = await applicationRepository.findById(id, userId);
    if (!existing) throw new Error("Not found");

    await applicationRepository.updateStatus(id, userId, status);
    const updated = await applicationRepository.findById(id, userId);

    await activityRepository.create({
      userId,
      applicationId: id,
      action: "STATUS_CHANGED",
      metadata: {
        from: existing.status,
        to: status,
        company: existing.company,
        label: STATUS_LABELS[status],
      },
    });

    await invalidateCachePattern(`analytics:${userId}*`);
    return updated;
  },

  async addInterview(
    applicationId: string,
    userId: string,
    data: { stage: string; scheduledAt?: string; notes?: string; outcome?: string }
  ) {
    const app = await applicationRepository.findById(applicationId, userId);
    if (!app) throw new Error("Not found");

    const interview = await interviewRepository.create(applicationId, {
      stage: data.stage,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      notes: data.notes,
      outcome: data.outcome,
    });

    await activityRepository.create({
      userId,
      applicationId,
      action: "INTERVIEW_SCHEDULED",
      metadata: { stage: data.stage, company: app.company },
    });

    return interview;
  },
};

export const authService = {
  async register(input: unknown) {
    const data = registerSchema.parse(input);
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error("Email already registered");

    const username =
      data.username ??
      slugify(data.name) + "-" + Math.random().toString(36).slice(2, 6);

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashed,
      username,
      apiKey: generateApiKey(),
      usageMetrics: { create: {} },
    });

    const email = welcomeEmail(data.name);
    await enqueueJob({
      type: "send-email",
      to: data.email,
      subject: email.subject,
      html: email.html,
    });

    return { id: user.id, email: user.email, username: user.username };
  },
};
