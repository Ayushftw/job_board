import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const resumeRepository = {
  findMany(userId: string) {
    return db.resume.findMany({
      where: { userId },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string, userId: string) {
    return db.resume.findFirst({
      where: { id, userId },
      include: { profile: true },
    });
  },

  create(userId: string, data: Prisma.ResumeCreateWithoutUserInput) {
    return db.resume.create({
      data: { ...data, userId },
      include: { profile: true },
    });
  },

  update(id: string, userId: string, data: Prisma.ResumeUpdateInput) {
    return db.resume.updateMany({ where: { id, userId }, data });
  },

  delete(id: string, userId: string) {
    return db.resume.deleteMany({ where: { id, userId } });
  },

  findByIdInternal(id: string) {
    return db.resume.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  updateParseStatus(id: string, parseStatus: "PENDING" | "PROCESSING" | "DONE" | "FAILED") {
    return db.resume.update({
      where: { id },
      data: { parseStatus },
    });
  },

  createProfile(resumeId: string, data: {
    skills: string[];
    technologies: string[];
    yearsOfExperience: number;
    education: unknown[];
    summary?: string;
    rawText?: string;
  }) {
    return db.resumeProfile.create({
      data: {
        resumeId,
        skills: data.skills,
        technologies: data.technologies,
        yearsOfExperience: data.yearsOfExperience,
        education: data.education as Prisma.InputJsonValue,
        summary: data.summary,
        rawText: data.rawText,
      },
    });
  },

  count(userId: string) {
    return db.resume.count({ where: { userId } });
  },
};
