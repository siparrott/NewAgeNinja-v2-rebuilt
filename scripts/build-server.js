#!/usr/bin/env node

/**
 * ES Module compatible server build script
 * This script replaces the problematic package.json build:server command
 */

import { build } from 'esbuild';

async function buildServerESM() {
  console.log('🔨 Building server with ES module format...');

  const sharedBuildOptions = {
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    external: [
      '@neondatabase/serverless',
      'lightningcss',
      '@babel/preset-typescript',
      'drizzle-orm',
      'drizzle-zod',
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
      '@supabase/supabase-js'
    ],
    allowOverwrite: true,
    sourcemap: false,
    minify: true,
    define: {
      'process.env.NODE_ENV': '"production"',
      '__DEV__': 'false'
    },
    banner: {
      js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

globalThis.__filename = __filename;
globalThis.__dirname = __dirname;
globalThis.require = require;
      `.trim()
    }
  };

  try {
    // Build server entry
    await build({
      ...sharedBuildOptions,
      entryPoints: ['server/index.ts'],
      outfile: 'dist/index.js',
    });

    // Build vite middleware for dynamic import in production
    await build({
      ...sharedBuildOptions,
      entryPoints: ['server/vite.ts'],
      outfile: 'dist/vite.js',
    });

    console.log('✅ ES module server build completed successfully');
  } catch (error) {
    console.error('❌ ES module server build failed:', error);
    process.exit(1);
  }
}

buildServerESM();