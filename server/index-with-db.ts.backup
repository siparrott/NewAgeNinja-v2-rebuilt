// Console silencing temporarily disabled for debugging
// import '../silence-console.js';

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import type { Request, Response, NextFunction } from "express";

// Override demo mode for production New Age Fotografie site
// This is NOT a demo - it's the live business website
if (!process.env.DEMO_MODE || process.env.DEMO_MODE === 'true') {
  process.env.DEMO_MODE = 'false';
  // New Age Fotografie CRM - Live Production Site (Demo Mode Disabled)
}

const app = express();

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Handle favicon specifically for serverless
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    routes_loaded: !!registerRoutes
  });
});

// Simple test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// Domain redirect middleware - redirect root domain to www
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.headers.host === 'newagefotografie.com') {
    return res.redirect(301, `https://www.newagefotografie.com${req.url}`);
  }
  next();
});

// Simple request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Register API routes with error handling
let registerRoutes;
try {
  const routesModule = await import("./routes/index.js");
  registerRoutes = routesModule.registerRoutes;
  registerRoutes(app);
  console.log('Routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
  // Continue without routes for now to test basic functionality
}

// Serve uploaded files statically (if they exist)
app.use('/uploads', express.static('public/uploads', { fallthrough: true }));

// Serve blog images statically (if they exist)
app.use('/blog-images', express.static('server/public/blog-images', { fallthrough: true }));

// Handle static files for production
if (process.env.NODE_ENV === 'production') {
  try {
    // Serve static files from dist/public (production build)
    const distPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(distPath, { fallthrough: true }));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads') && !req.path.startsWith('/blog-images')) {
        try {
          const indexPath = path.join(distPath, 'index.html');
          res.sendFile(indexPath, (err) => {
            if (err) {
              console.error('Error serving index.html:', err);
              res.status(404).send('Frontend not built. Run npm run build first.');
            }
          });
        } catch (error) {
          console.error('Error in SPA fallback:', error);
          res.status(500).send('Server error');
        }
      }
    });
  } catch (error) {
    console.error('Error setting up static file serving:', error);
  }
}

// Global error handler
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

// 404 handler for unmatched routes
app.use('*', (req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Export the Express app for Vercel serverless deployment
export default app;
