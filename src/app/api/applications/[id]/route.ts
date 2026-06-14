import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { applicationService } from "@/services/application.service";
import { updateApplicationSchema } from "@/dto/application.dto";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withApiHandler(request, async (userId) => {
    return applicationService.getById(id, userId);
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withApiHandler(request, async (userId) => {
    const body = await request.json();
    const input = updateApplicationSchema.parse(body);
    return applicationService.update(id, userId, input);
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withApiHandler(request, async (userId) => {
    return applicationService.delete(id, userId);
  });
}
