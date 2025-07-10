#!/usr/bin/env node

// Root workspace startup script - handles working directory properly
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set correct working directory for deployment
const workspaceDir = resolve(__dirname);
// Ensure we're in the workspace directory for Replit deployment
if (process.env.REPL_ID) {
  process.chdir('/home/runner/workspace');
} else {
  process.chdir(workspaceDir);
}

// Environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
// This is the live production site, not a demo
process.env.DEMO_MODE = 'false';

console.log('🚀 Photography CRM - Workspace Startup');
console.log('📁 Workspace directory:', workspaceDir);
console.log('📂 Current working directory:', process.cwd());

// Check if built server exists
import { existsSync } from 'fs';
const serverPath = resolve(workspaceDir, 'dist', 'index.js');

if (!existsSync(serverPath)) {
  console.error('❌ Server bundle not found at:', serverPath);
  console.error('🔨 Please run: npm run build');
  process.exit(1);
}

// Start the server from dist directory
import('./dist/index.js')
  .then(() => {
    console.log('✅ Server started from workspace directory');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });