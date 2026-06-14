import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});

export function logRequest(
  method: string,
  path: string,
  userId: string | null,
  durationMs: number,
  statusCode: number
) {
  logger.info({ method, path, userId, durationMs, statusCode }, "api_request");
}
