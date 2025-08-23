// Console silencing temporarily disabled for debugging
// import '../silence-console.js';

import "dotenv/config";
// @ts-ignore
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index.js";
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

// Serve blog images statically
app.use('/blog-images', express.static('server/public/blog-images'));

// Domain redirect middleware - redirect root domain to www
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.headers.host === 'newagefotografie.com') {
    return res.redirect(301, `https://www.newagefotografie.com${req.url}`);
  }
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;



  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Enhanced error logging for production debugging
    console.error('Server Error:', {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method,
      timestamp: new Date().toISOString()
    });

    res.status(status).json({ message });
  });

  // Add a specific middleware to protect API routes from Vite's catch-all
  app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
    // Skip Vite handling for API routes
    next();
  });



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
