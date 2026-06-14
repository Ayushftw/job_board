import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api";
import { applicationService } from "@/services/application.service";
import {
  createApplicationSchema,
  applicationQuerySchema,
} from "@/dto/application.dto";

export async function GET(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = applicationQuerySchema.parse(params);
    return applicationService.list(userId, query);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(request, async (userId) => {
    const body = await request.json();
    const input = createApplicationSchema.parse(body);
    return applicationService.create(userId, input);
  });
}
