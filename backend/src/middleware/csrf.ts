import { createMiddleware } from "hono/factory";
import crypto from "crypto";

export const csrf = () => {
  return createMiddleware(async (c, next) => {
    // GETリクエストはスキップ
    if (c.req.method === "GET" || c.req.method === "HEAD") {
      await next();
      return;
    }

    const token = c.req.header("X-CSRF-Token");
    const sessionToken = c.get("csrfToken"); // セッションから取得

    if (!token || token !== sessionToken) {
      return c.json({ error: "Invalid CSRF token" }, 403);
    }

    await next();
  });
};

// CSRFトークン生成エンドポイント
export const generateCSRFToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
};
