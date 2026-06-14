import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { resumeService } from "@/services/resume.service";
import { createResumeSchema } from "@/dto/resume.dto";

export async function GET(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    return resumeService.list(userId);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    const body = await request.json();
    const input = createResumeSchema.parse(body);
    return resumeService.create(userId, input);
  });
}
