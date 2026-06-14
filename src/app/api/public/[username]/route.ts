import { NextRequest } from "next/server";
import { cacheAside } from "@/lib/redis";
import { userRepository } from "@/repositories/user.repository";
import { apiSuccess, apiError } from "@/lib/api";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { username } = await params;

  const profile = await cacheAside(`public:profile:${username}`, 600, async () => {
    const user = await userRepository.getPublicProfile(username);
    if (!user) return null;

    const apps = user.applications ?? [];
    const total = apps.length;
    const interviews = apps.filter((a) =>
      ["SCREENING", "TECHNICAL", "MANAGER_ROUND", "FINAL_ROUND", "OFFER"].includes(a.status)
    ).length;
    const offers = apps.filter((a) => a.status === "OFFER").length;
    const responded = apps.filter((a) => a.status !== "APPLIED").length;

    const latestProfile = user.resumes[0]?.profile;

    return {
      name: user.name,
      username: user.username,
      image: user.image,
      memberSince: user.createdAt,
      stats: {
        totalApplications: total,
        interviews,
        offers,
        responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      },
      skills: latestProfile?.skills ?? [],
      technologies: latestProfile?.technologies ?? [],
      summary: latestProfile?.summary,
    };
  });

  if (!profile) return apiError("Profile not found", 404);
  return apiSuccess(profile);
}
