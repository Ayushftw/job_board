import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logRequest } from "./logger";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Validation failed", 422, error.flatten());
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    if (error.message === "Not found") {
      return apiError("Not found", 404);
    }
    console.error(error);
    return apiError(error.message, 500);
  }
  return apiError("Internal server error", 500);
}

export async function withApiHandler<T>(
  request: Request,
  handler: (userId: string) => Promise<T>,
  options?: { requireAuth?: boolean }
) {
  const start = Date.now();
  const { getAuthUserId } = await import("./auth");
  const userId = await getAuthUserId(request);
  const requireAuth = options?.requireAuth !== false;

  if (requireAuth && !userId) {
    return apiError("Unauthorized", 401);
  }

  try {
    const result = await handler(userId!);
    logRequest(
      request.method,
      new URL(request.url).pathname,
      userId,
      Date.now() - start,
      200
    );
    return apiSuccess(result);
  } catch (error) {
    logRequest(
      request.method,
      new URL(request.url).pathname,
      userId,
      Date.now() - start,
      500
    );
    return handleApiError(error);
  }
}
