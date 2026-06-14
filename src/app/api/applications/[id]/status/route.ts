import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { applicationService } from "@/services/application.service";
import { updateStatusSchema } from "@/dto/application.dto";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withApiHandler(request, async (userId) => {
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);
    return applicationService.updateStatus(id, userId, status);
  });
}
