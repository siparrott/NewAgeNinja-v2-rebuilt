#!/usr/bin/env node

/**
 * Production server startup script for New Age Fotografie CRM
 * Handles environment variables and port binding for Replit deployment
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';
process.env.DEMO_MODE = 'false';

// Use PORT from environment or default to 5000
const port = process.env.PORT || '5000';
process.env.PORT = port;

console.log('🎯 Starting New Age Fotografie CRM - Live Production Site');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);
console.log(`Working directory: ${process.cwd()}`);

// Start the server with tsx
const serverPath = resolve(__dirname, 'server/index.ts');
const child = spawn('tsx', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port,
    DEMO_MODE: 'false'
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  child.kill('SIGINT');
});
