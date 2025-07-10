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
  'tsx',
  // Frontend dependencies (should not be in server bundle)
  'react',
  'react-dom',
  'vite',
  'lucide-react',
  '@radix-ui/*',
  '@tanstack/react-query',
  // Babel and build-time dependencies
  '@babel/*',
  '@types/*',
  'typescript',
  'esbuild',
  'postcss',
  'tailwindcss',
  'autoprefixer',
  // Supabase
  '@supabase/supabase-js',
  // Development tools
  '@replit/*'
];

export const serverBuildConfig = {
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  packages: 'external', // Treat all packages as external
  allowOverwrite: true,
  sourcemap: !isProduction,
  minify: isProduction,
  keepNames: true,
  logLevel: 'info',
  resolveExtensions: ['.ts', '.js', '.mjs'],
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'default'],
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