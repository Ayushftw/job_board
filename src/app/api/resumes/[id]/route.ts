import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { resumeService } from "@/services/resume.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withApiHandler(request, async (userId) => {
    return resumeService.getById(id, userId);
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withApiHandler(request, async (userId) => {
    return resumeService.delete(id, userId);
  });
}
