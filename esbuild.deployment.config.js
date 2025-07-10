import { build } from 'esbuild';

build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: ['node18'],
  format: 'esm', // ← critical line for ES module support
  outfile: 'dist/index.js',
  external: [
    // Core Node.js and server dependencies that should not be bundled
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
    // ESM-only dependencies
    'lightningcss',
    '@babel/preset-typescript',
    // Supabase
    '@supabase/supabase-js',
  ],
  allowOverwrite: true,
  sourcemap: false,
  minify: true,
  keepNames: true,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.NODE_ENV': '"production"',
    '__DEV__': 'false',
    'import.meta.hot': 'undefined'
  },
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
}).catch(() => process.exit(1));