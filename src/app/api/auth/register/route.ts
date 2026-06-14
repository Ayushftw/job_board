import { NextRequest } from "next/server";
import { authService } from "@/services/application.service";
import { apiSuccess, handleApiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await authService.register(body);
    return apiSuccess(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
