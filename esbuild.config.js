import { build } from 'esbuild';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// External dependencies that should not be bundled
const external = [
  // Core Node.js and server dependencies
  '@neondatabase/serverless',
  'drizzle-orm',
  'drizzle-zod', 
  'drizzle-kit',
  'express',
  'passport',
  'passport-local',
  'express-session',
  'connect-pg-simple',
  'node-fetch',
  'jsdom',
  'papaparse',
  'uuid',
  'date-fns',
  'zod',
  'nanoid',
  'bcryptjs',
  'helmet',
  'cors',
  'compression',
  // Frontend dependencies (should not be in server bundle)
  'react',
  'react-dom',
  'vite',
  'lucide-react',
  '@radix-ui/*',
  '@tanstack/react-query',
  // Build and development tools (exclude from production)
  'tsx',
  '@babel/*',
  '@types/*',
  'typescript',
  'esbuild',
  'postcss',
  'tailwindcss',
  'autoprefixer',
  '@replit/*',
  // Supabase
  '@supabase/supabase-js',
  // Node.js built-ins
  'crypto',
  'fs',
  'path',
  'url',
  'util',
  'http',
  'https',
  'stream',
  'events',
  'buffer',
  'os',
  'process',
  'module'
];

export const serverBuildConfig = {
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  external: external, // Use the explicit external list
  allowOverwrite: true,
  sourcemap: !isProduction,
  minify: isProduction,
  keepNames: true,
  logLevel: 'info',
  resolveExtensions: ['.ts', '.js', '.mjs', '.json'],
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'node', 'default'],
  loader: {
    '.json': 'json'
  },
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`,
    'import.meta.env.NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`,
    // Disable development features in production
    '__DEV__': 'false',
    'import.meta.hot': 'undefined'
  },
  // Ignore development-only imports
  plugins: [{
    name: 'ignore-dev-imports',
    setup(build) {
      // Replace entire vite.ts module in production
      build.onResolve({ filter: /\.\/vite$|\.\/vite\.ts$/ }, () => {
        return { path: 'production-vite', namespace: 'virtual' };
      });
      
      // Ignore vite HMR and development utilities
      build.onResolve({ filter: /refreshUtils|@react-refresh|react-refresh/ }, () => {
        return { path: 'empty-module', namespace: 'virtual' };
      });
      
      build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
        if (args.path === 'production-vite') {
          return { 
            contents: `
              // Production-only vite module (no HMR)
              import express from "express";
              import fs from "fs";
              import path from "path";
              
              export function log(message, source = "express") {
                const formattedTime = new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                });
                console.log(\`\${formattedTime} [\${source}] \${message}\`);
              }
              
              export async function setupVite(app, server) {
                // No-op in production
                log("Vite HMR disabled in production");
              }
              
              export function serveStatic(app) {
                const distPath = path.resolve(process.cwd(), "public");
                
                if (!fs.existsSync(distPath)) {
                  throw new Error(\`Could not find the build directory: \${distPath}, make sure to build the client first\`);
                }
                
                app.use(express.static(distPath));
                
                // fall through to index.html if the file doesn't exist
                app.use("*", (_req, res) => {
                  res.sendFile(path.resolve(distPath, "index.html"));
                });
              }
            `,
            loader: 'js'
          };
        }
        
        return { contents: 'export default {};', loader: 'js' };
      });
    }
  }],
  banner: {
    js: `
// ES Module compatibility shims for Node.js
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Global shims for compatibility  
globalThis.__filename = __filename;
globalThis.__dirname = __dirname;
globalThis.require = require;
    `.trim()
  }
};

// Build function for server
export async function buildServer() {
  try {
    console.log('🔨 Building server with ES module format...');
    await build(serverBuildConfig);
    console.log('✅ Server build completed successfully');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    throw error;
  }
}

// Run build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().catch(process.exit);
}