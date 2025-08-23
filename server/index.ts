// Console silencing temporarily disabled for debugging
// import '../silence-console.js';

import "dotenv/config";
// @ts-ignore
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index.js";
// Disable cron jobs for serverless deployment
// import "./jobs";

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

// Register API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Use dynamic imports for better serverless compatibility
  Promise.resolve().then(async () => {
    const path = await import('path');
    const fs = await import('fs');
    
    // Serve static files from dist/public (production build)
    const distPath = path.join(process.cwd(), 'dist/public');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // SPA fallback - serve index.html for all non-API routes
      app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api/')) {
          const indexPath = path.join(distPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send('Frontend not built. Run npm run build first.');
          }
        }
      });
    }
  });
}

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

// Export the Express app for Vercel serverless deployment
export default app;
