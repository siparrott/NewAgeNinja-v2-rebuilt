#!/usr/bin/env node

// ES Module startup script for deployment
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set deployment environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.DEMO_MODE = process.env.DEMO_MODE || 'true';

// Import and start the server
import('./dist/index.js')
  .then(() => {
    console.log('✅ Server started successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
