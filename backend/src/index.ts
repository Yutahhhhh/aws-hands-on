import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import userRoutes from "./routes/users";
import { xrayMiddleware } from "./middleware/xray";
import "dotenv/config";

const app = new Hono();

app.use("*", xrayMiddleware());
app.use("*", logger());
app.use("*", cors());

// ALB用のヘルスチェック
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.route("/api/users", userRoutes);

app.get("/", (c) => {
  return c.json({
    message: "Hono CRUD API Server",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      users: "/api/users",
    },
  });
});

const port = parseInt(process.env.PORT || "3000");

console.info(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
