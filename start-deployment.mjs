#!/usr/bin/env node
// Simple start script for deployment
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set working directory
process.chdir(__dirname);

// Start the server
await import('./dist/index.js');
