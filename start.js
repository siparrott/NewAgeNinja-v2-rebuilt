#!/usr/bin/env node

/**
 * CommonJS fallback start script
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🎯 New Age Fotografie CRM - Production Start (CommonJS)');

const CONFIG = {
  port: process.env.PORT || 5000,
  host: '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'production'
};

function findServerFile() {
  const possibleFiles = [
    path.resolve(process.cwd(), 'dist/index.js'),
    path.resolve(process.cwd(), 'index.js'),
    path.resolve(__dirname, 'dist/index.js'),
    path.resolve(__dirname, 'index.js')
  ];
  
  for (const file of possibleFiles) {
    if (existsSync(file)) {
      console.log('🔍 Found server file:', file);
      return file;
    }
  }
  
  throw new Error('Could not find server file');
}

try {
  const serverFile = findServerFile();
  
  console.log('🚀 Starting server...');
  console.log('📄 Server file:', serverFile);
  console.log('🌐 Binding to', CONFIG.host + ':' + CONFIG.port);
  
  const serverProcess = spawn('node', [serverFile], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: CONFIG.nodeEnv,
      PORT: CONFIG.port.toString()
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
  
} catch (error) {
  console.error('❌ Startup failed:', error.message);
  process.exit(1);
}
