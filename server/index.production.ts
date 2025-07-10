import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";

// Override demo mode for New Age Fotografie production site
process.env.DEMO_MODE = 'false';
console.log('🎯 New Age Fotografie CRM - Live Production Site');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Production static file serving
function serveStatic(app: express.Application) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }
  
  app.use(express.static(distPath));
  
  // Fallback to index.html for SPA routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Always serve static files in production
  serveStatic(app);

  // Listen on the port provided by Cloud Run or default to 5000
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  
  server.listen(port, host, () => {
    log(`Production server running on ${host}:${port}`);
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Demo mode: ${process.env.DEMO_MODE}`);
    log(`Working directory: ${process.cwd()}`);
  });
})();