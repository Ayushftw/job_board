import { resumeRepository } from "@/repositories/resume.repository";
import { activityRepository, usageMetricsRepository } from "@/repositories/activity.repository";
import { enqueueJob } from "@/lib/queue";
import { cacheAside, invalidateCache } from "@/lib/redis";
import type { CreateResumeInput } from "@/dto/resume.dto";
import type { ResumeProfileData } from "@/types";

export const resumeService = {
  async list(userId: string) {
    return resumeRepository.findMany(userId);
  },

  async getById(id: string, userId: string) {
    const resume = await resumeRepository.findById(id, userId);
    if (!resume) throw new Error("Not found");
    return resume;
  },

  async getProfileCached(id: string, userId: string) {
    return cacheAside(`resume:${id}:profile`, 86400, async () => {
      const resume = await resumeRepository.findById(id, userId);
      if (!resume) throw new Error("Not found");
      return resume;
    });
  },

  async create(userId: string, input: CreateResumeInput) {
    const count = await resumeRepository.count(userId);
    const resume = await resumeRepository.create(userId, {
      name: input.name,
      fileUrl: input.fileUrl,
      fileKey: input.fileKey,
      tags: input.tags ?? [],
      version: count + 1,
      parseStatus: "PENDING",
    });

    await activityRepository.create({
      userId,
      action: "RESUME_UPLOADED",
      metadata: { name: resume.name, version: resume.version },
    });

    await usageMetricsRepository.increment(userId, "totalResumes");

    await enqueueJob({
      type: "parse-resume",
      resumeId: resume.id,
      fileUrl: resume.fileUrl,
    });

    return resume;
  },

  async delete(id: string, userId: string) {
    const resume = await resumeRepository.findById(id, userId);
    if (!resume) throw new Error("Not found");
    await resumeRepository.delete(id, userId);
    await invalidateCache(`resume:${id}:profile`);
    return { success: true, fileKey: resume.fileKey };
  },

  async saveParsedProfile(resumeId: string, profile: ResumeProfileData, rawText: string) {
    await resumeRepository.createProfile(resumeId, {
      ...profile,
      rawText,
    });
    await resumeRepository.updateParseStatus(resumeId, "DONE");
    await invalidateCache(`resume:${resumeId}:profile`);
  },
};
