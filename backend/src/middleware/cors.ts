import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

export const corsMiddleware = (): MiddlewareHandler => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

  return cors({
    origin: (origin) => {
      // 開発環境では全てのオリジンを許可
      if (process.env.NODE_ENV === "development") {
        return origin;
      }

      // 本番環境では許可リストのオリジンのみ
      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      return null;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["X-Total-Count"],
    maxAge: 86400, // 24時間
    credentials: true,
  });
};
