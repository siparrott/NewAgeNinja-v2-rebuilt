// Minimal serverless function without database for testing
import "dotenv/config";
import express from "express";
import path from "path";
import type { Request, Response, NextFunction } from "express";

const app = express();

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Simple request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Domain redirect middleware - redirect root domain to www
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.headers.host === 'newagefotografie.com') {
    return res.redirect(301, `https://www.newagefotografie.com${req.url}`);
  }
  next();
});

// API ROUTES FIRST - before static file serving
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
    database: 'supabase (testing)'
  });
});

// Supabase test endpoint
app.get('/api/test', async (req: Request, res: Response) => {
  try {
    // Test Supabase connection
    const { testSupabaseConnection } = await import("./supabase.js");
    const connectionTest = await testSupabaseConnection();
    
    res.json({
      message: 'Serverless function is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      database: connectionTest
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error testing Supabase connection',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add Supabase test routes
try {
  const supabaseTestRoutes = await import("./routes/supabase-test.js");
  app.use('/api/supabase-test', supabaseTestRoutes.default);
  console.log('Supabase test routes loaded');
} catch (error) {
  console.error('Error loading Supabase test routes:', error);
}

// Handle static files for production AFTER API routes
if (process.env.NODE_ENV === 'production') {
  try {
    // Serve static files from dist/public (production build)
    const distPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(distPath, { fallthrough: true }));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api/') && !req.path.startsWith('/health') && req.path !== '/favicon.ico') {
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
