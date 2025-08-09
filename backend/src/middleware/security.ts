import type { MiddlewareHandler } from "hono";

export const securityHeaders = (): MiddlewareHandler => {
  return async (c, next) => {
    await next();

    // セキュリティヘッダーの設定
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    // CSPヘッダー
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' " + (process.env.ALLOWED_ORIGINS || ""),
      "frame-ancestors 'none'",
    ].join("; ");

    c.header("Content-Security-Policy", cspDirectives);
  };
};
