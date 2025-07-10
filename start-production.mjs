#!/usr/bin/env node

// Production deployment start script
// This uses the same server configuration that works in development

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set working directory
process.chdir(__dirname);

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🚀 Starting production server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Start the server using tsx (which we know works)
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
