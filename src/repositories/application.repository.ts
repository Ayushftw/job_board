import { db } from "@/lib/db";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import type { ApplicationQueryInput } from "@/dto/application.dto";

export const applicationRepository = {
  findMany(userId: string, query: ApplicationQueryInput) {
    const where: Prisma.ApplicationWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { company: { contains: query.search, mode: "insensitive" } },
              { role: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return db.application.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { interviews: true },
    });
  },

  count(userId: string, where?: Prisma.ApplicationWhereInput) {
    return db.application.count({ where: { userId, ...where } });
  },

  findById(id: string, userId: string) {
    return db.application.findFirst({
      where: { id, userId },
      include: {
        interviews: { orderBy: { scheduledAt: "asc" } },
        aiMessages: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  },

  create(userId: string, data: Prisma.ApplicationCreateWithoutUserInput) {
    return db.application.create({
      data: { ...data, userId },
      include: { interviews: true },
    });
  },

  update(id: string, userId: string, data: Prisma.ApplicationUpdateInput) {
    return db.application.updateMany({
      where: { id, userId },
      data,
    });
  },

  async updateAndReturn(
    id: string,
    userId: string,
    data: Prisma.ApplicationUpdateInput
  ) {
    await db.application.updateMany({ where: { id, userId }, data });
    return this.findById(id, userId);
  },

  delete(id: string, userId: string) {
    return db.application.deleteMany({ where: { id, userId } });
  },

  updateStatus(id: string, userId: string, status: ApplicationStatus) {
    return db.application.updateMany({
      where: { id, userId },
      data: { status },
    });
  },

  findAllForUser(userId: string) {
    return db.application.findMany({
      where: { userId },
      orderBy: { appliedAt: "desc" },
    });
  },

  groupByStatus(userId: string) {
    return db.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });
  },

  groupByMonth(userId: string) {
    return db.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT TO_CHAR("appliedAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
      FROM "Application"
      WHERE "userId" = ${userId}
      GROUP BY month
      ORDER BY month ASC
    `;
  },
};
