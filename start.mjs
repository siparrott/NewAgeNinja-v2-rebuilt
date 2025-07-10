#!/usr/bin/env node

// ES Module startup script with flexible path resolution
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try different possible locations for the application
const possiblePaths = [
  resolve(__dirname, 'index.js'),
  resolve(__dirname, 'dist/index.js'),
  resolve(process.cwd(), 'index.js'),
  resolve(process.cwd(), 'dist/index.js'),
  resolve('/home/runner/workspace/dist/index.js'),
  resolve('/home/runner/workspace/index.js')
];

console.log('🎯 New Age Fotografie CRM - Starting Production Server');
console.log('Working directory:', process.cwd());
console.log('Script location:', __dirname);

let serverPath = null;
for (const path of possiblePaths) {
  if (existsSync(path)) {
    serverPath = path;
    console.log('✅ Found server at:', serverPath);
    break;
  }
}

if (!serverPath) {
  console.error('❌ Could not locate server file. Tried paths:');
  possiblePaths.forEach(path => console.error('  -', path));
  process.exit(1);
}

// Ensure proper environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '5000';

// Start the server
try {
  await import(serverPath);
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
}
