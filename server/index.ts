// Console silencing temporarily disabled for debugging
// import '../silence-console.js';

import "dotenv/config";
// @ts-ignore
import express from "express";
import { createServer } from "http";
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
const server = createServer(app);

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

  // Add a specific middleware to protect API routes from Vite's catch-all
  app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
    // Skip Vite handling for API routes
    next();
  });

  // For Vercel deployment, use the assigned port or default
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  
  server.listen(port, host, () => {
    console.log(`✅ New Age Fotografie CRM successfully started on ${host}:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Working directory: ${process.cwd()}`);
    console.log(`Demo mode: ${process.env.DEMO_MODE}`);
  });
