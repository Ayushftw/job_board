import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const userRepository = {
  findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: { usageMetrics: true },
    });
  },

  findByUsername(username: string) {
    return db.user.findUnique({
      where: { username },
      include: {
        usageMetrics: true,
        resumes: {
          include: { profile: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  },

  findByApiKey(apiKey: string) {
    return db.user.findUnique({ where: { apiKey } });
  },

  create(data: Prisma.UserCreateInput) {
    return db.user.create({ data });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return db.user.update({ where: { id }, data });
  },

  async getPublicProfile(username: string) {
    const user = await db.user.findUnique({
      where: { username, publicProfile: true },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
        usageMetrics: true,
        resumes: {
          where: { parseStatus: "DONE" },
          include: { profile: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        applications: {
          select: { status: true },
        },
      },
    });
    return user;
  },
};
