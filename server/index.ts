import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Override demo mode for production New Age Fotografie site
// This is NOT a demo - it's the live business website
if (!process.env.DEMO_MODE || process.env.DEMO_MODE === 'true') {
  process.env.DEMO_MODE = 'false';
  console.log('🎯 New Age Fotografie CRM - Live Production Site (Demo Mode Disabled)');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Domain redirect middleware - redirect root domain to www
app.use((req, res, next) => {
  if (req.headers.host === 'newagefotografie.com') {
    return res.redirect(301, `https://www.newagefotografie.com${req.url}`);
  }
  next();
});

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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // For deployment, we'll use development Vite middleware since the build is too complex
  // This serves the React app properly while keeping production API endpoints
  if (app.get("env") === "development" || process.env.NODE_ENV === "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Listen on the port provided by the environment or default to 5000
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = "0.0.0.0";
  
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Working directory: ${process.cwd()}`);
  });
})();
