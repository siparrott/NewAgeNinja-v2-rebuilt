// Console silencing temporarily disabled for debugging
// import '../silence-console.js';

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "./jobs";

// Override demo mode for production New Age Fotografie site
// This is NOT a demo - it's the live business website
if (!process.env.DEMO_MODE || process.env.DEMO_MODE === 'true') {
  process.env.DEMO_MODE = 'false';
  // New Age Fotografie CRM - Live Production Site (Demo Mode Disabled)
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static('public/uploads'));

// Serve blog images statically (before Vite middleware)
app.use('/blog-images', express.static('server/public/blog-images', {
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

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

  // Global error handler with comprehensive logging
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Enhanced error logging for production debugging
    console.error('SERVER ERROR DETECTED:', {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method,
      headers: _req.headers,
      body: _req.body,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    // For critical production errors, serve a hardcoded fallback
    if (status === 500 && _req.url === '/') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Age Fotografie - Familienfotograf Wien</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 2rem; }
            .hero h1 { font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .hero p { font-size: 1.5rem; margin-bottom: 2rem; }
            .btn { display: inline-block; padding: 1rem 2rem; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; transition: transform 0.3s; }
            .btn:hover { transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="hero">
            <div>
              <h1>Endlich ein Fotostudio</h1>
              <p>das spontane, natürliche und individuelle Porträts Ihrer Familie liefert...</p>
              <a href="/warteliste" class="btn">Fotoshooting buchen</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    res.status(status).json({ message });
  });

  // Remove problematic API middleware that might be causing 403 errors
  // app.use('/api/*', (req, res, next) => {
  //   // Skip Vite handling for API routes
  //   next();
  // });

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

  // Dynamically find available port starting from 5000
  const findPort = async (startPort: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      const testServer = server.listen(startPort, '0.0.0.0', (err?: Error) => {
        if (err) {
          // Port is busy, try next one
          testServer.close();
          if (startPort < 5010) {
            findPort(startPort + 1).then(resolve).catch(reject);
          } else {
            reject(new Error('No available ports found between 5000-5010'));
          }
        } else {
          testServer.close(() => {
            resolve(startPort);
          });
        }
      });
    });
  };

  const port = await findPort(parseInt(process.env.PORT || '5000', 10));
  const host = "0.0.0.0";
  
  server.listen(port, host, () => {
    log(`✅ New Age Fotografie CRM successfully started on ${host}:${port}`);
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Working directory: ${process.cwd()}`);
    log(`Demo mode: ${process.env.DEMO_MODE}`);
  });
})();
