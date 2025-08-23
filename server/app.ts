import express, { type Request, type Response, type NextFunction } from "express";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// Mount routes
import { registerRoutes } from "./routes/index.js";
registerRoutes(app);

// Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now(), env: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const code = Number(err?.statusCode || 500);
  const msg = (err?.message ?? String(err)).slice(0, 2000);
  res.status(code).json({ ok: false, error: msg, code });
});

export default app;
