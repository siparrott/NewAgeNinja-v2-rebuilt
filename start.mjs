#!/usr/bin/env node

// Root workspace startup script - handles working directory properly
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set correct working directory for deployment
const workspaceDir = resolve(__dirname);
process.chdir(workspaceDir);

// Environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.DEMO_MODE = process.env.DEMO_MODE || 'true';

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