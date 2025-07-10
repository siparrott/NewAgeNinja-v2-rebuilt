#!/usr/bin/env node

/**
 * Robust production start script with error handling
 * Handles missing package.json and provides fallback mechanisms
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  port: process.env.PORT || 5000,
  host: '0.0.0.0', // Ensure external access
  nodeEnv: process.env.NODE_ENV || 'production',
  demoMode: process.env.DEMO_MODE || 'false'
};

console.log('🎯 New Age Fotografie CRM - Production Start');
console.log('📍 Configuration:', CONFIG);

// Set environment variables
process.env.NODE_ENV = CONFIG.nodeEnv;
process.env.DEMO_MODE = CONFIG.demoMode;
process.env.PORT = CONFIG.port.toString();

function findWorkingDirectory() {
  // Try multiple possible working directories
  const possibleDirs = [
    process.cwd(),
    __dirname,
    '/home/runner/workspace',
    '/home/runner',
    resolve(__dirname, '..')
  ];
  
  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      console.log(`📂 Found working directory: ${dir}`);
      return dir;
    }
  }
  
  throw new Error('Could not find a valid working directory');
}

function findServerFile() {
  const workDir = findWorkingDirectory();
  
  // Try multiple possible server files
  const possibleFiles = [
    resolve(workDir, 'dist/index.js'),
    resolve(workDir, 'index.js'),
    resolve(workDir, 'server.js'),
    resolve(workDir, 'build/index.js')
  ];
  
  for (const file of possibleFiles) {
    if (existsSync(file)) {
      console.log(`🔍 Found server file: ${file}`);
      return file;
    }
  }
  
  throw new Error(`Could not find server file. Searched: ${possibleFiles.join(', ')}`);
}

function ensurePackageJson() {
  const workDir = findWorkingDirectory();
  const packageJsonPath = resolve(workDir, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.warn(`⚠️  No package.json found at ${packageJsonPath}`);
    
    // Check if there's a package.json in dist or other locations
    const fallbackLocations = [
      resolve(workDir, 'dist/package.json'),
      resolve(__dirname, 'package.json'),
      '/home/runner/package.json'
    ];
    
    for (const fallback of fallbackLocations) {
      if (existsSync(fallback)) {
        console.log(`📋 Using package.json from ${fallback}`);
        return fallback;
      }
    }
    
    console.log('🔄 Creating minimal package.json for production...');
    const minimalPackageJson = {
      "name": "newage-fotografie-crm",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js"
    };
    
    require('fs').writeFileSync(packageJsonPath, JSON.stringify(minimalPackageJson, null, 2));
    console.log(`✅ Created minimal package.json at ${packageJsonPath}`);
  }
  
  return packageJsonPath;
}

async function startServer() {
  try {
    // Ensure package.json exists
    ensurePackageJson();
    
    // Find server file
    const serverFile = findServerFile();
    
    // Change to working directory
    const workDir = findWorkingDirectory();
    process.chdir(workDir);
    
    console.log(`🚀 Starting server from ${workDir}`);
    console.log(`📄 Server file: ${serverFile}`);
    console.log(`🌐 Binding to ${CONFIG.host}:${CONFIG.port}`);
    
    // Start the server process
    const serverProcess = spawn('node', [serverFile], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: CONFIG.nodeEnv,
        PORT: CONFIG.port.toString(),
        DEMO_MODE: CONFIG.demoMode
      }
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error);
      process.exit(1);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`🔄 Server process exited with code ${code}`);
      if (code !== 0) {
        process.exit(code);
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📡 Received SIGTERM, shutting down gracefully...');
      serverProcess.kill();
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('📡 Received SIGINT, shutting down gracefully...');
      serverProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('📊 Debugging information:');
    console.error('  Current working directory:', process.cwd());
    console.error('  __dirname:', __dirname);
    console.error('  Environment variables:');
    console.error('    NODE_ENV:', process.env.NODE_ENV);
    console.error('    PORT:', process.env.PORT);
    console.error('    DEMO_MODE:', process.env.DEMO_MODE);
    
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});
