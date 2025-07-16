#!/usr/bin/env node

/**
 * Production-ready startup script for New Age Fotografie CRM
 * This script ensures stable deployment with proper error handling
 * and automatic recovery mechanisms.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const logFile = 'deployment.log';
const pidFile = 'server.pid';

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${message}`);
  fs.appendFileSync(logFile, `${timestamp} - ${message}\n`);
}

function startServer() {
  log('🚀 Starting New Age Fotografie CRM production server...');
  
  // Set production environment variables
  process.env.NODE_ENV = 'production';
  process.env.DEMO_MODE = 'false';
  
  // Kill any existing server process
  if (fs.existsSync(pidFile)) {
    try {
      const oldPid = fs.readFileSync(pidFile, 'utf8').trim();
      process.kill(oldPid, 'SIGTERM');
      log(`Terminated old server process: ${oldPid}`);
    } catch (error) {
      log(`Failed to kill old process: ${error.message}`);
    }
    fs.unlinkSync(pidFile);
  }
  
  // Choose server configuration
  let serverScript = 'server/index.production.ts';
  if (!fs.existsSync(serverScript)) {
    log('⚠️ Production server not found, using development configuration');
    serverScript = 'server/index.ts';
  }
  
  log(`✅ Using server script: ${serverScript}`);
  
  // Start server with tsx for TypeScript execution
  const serverProcess = spawn('npx', ['tsx', serverScript], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    detached: false
  });
  
  // Save PID for monitoring
  fs.writeFileSync(pidFile, serverProcess.pid.toString());
  log(`Server started with PID: ${serverProcess.pid}`);
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(output);
      fs.appendFileSync(logFile, `${new Date().toISOString()} - STDOUT: ${output}\n`);
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      console.error(error);
      fs.appendFileSync(logFile, `${new Date().toISOString()} - STDERR: ${error}\n`);
    }
  });
  
  // Handle server exit
  serverProcess.on('exit', (code, signal) => {
    log(`Server exited with code ${code} and signal ${signal}`);
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    
    // Auto-restart on unexpected exit
    if (code !== 0 && signal !== 'SIGTERM') {
      log('🔄 Server crashed, restarting in 5 seconds...');
      setTimeout(startServer, 5000);
    }
  });
  
  // Handle process signals
  process.on('SIGTERM', () => {
    log('Received SIGTERM, gracefully shutting down...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    log('Received SIGINT, gracefully shutting down...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  return serverProcess;
}

// Health check function
async function healthCheck() {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      log('✅ Health check passed');
      return true;
    } else {
      log(`❌ Health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`);
    return false;
  }
}

// Start the server
const server = startServer();

// Set up health monitoring
setInterval(async () => {
  const isHealthy = await healthCheck();
  if (!isHealthy && fs.existsSync(pidFile)) {
    log('⚠️ Server appears unhealthy, attempting restart...');
    server.kill('SIGTERM');
  }
}, 60000); // Check every minute

log('🎯 Production server startup completed');