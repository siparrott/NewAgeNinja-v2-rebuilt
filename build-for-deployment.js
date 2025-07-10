#!/usr/bin/env node

/**
 * Deployment build script that Replit will use
 * This replaces the problematic package.json build script
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function buildForDeployment() {
  console.log('🚀 Building Photography CRM for deployment...');
  
  try {
    // Step 1: Build client with production Vite config
    console.log('🔨 Building client application...');
    await execAsync('vite build --config vite.deployment.config.js');
    console.log('✅ Client build completed');
    
    // Step 2: Build server with ES module configuration
    console.log('🔨 Building server with ES modules...');
    await execAsync('node esbuild.deployment.config.js');
    console.log('✅ Server build completed');
    
    // Step 3: Verify deployment files exist
    const requiredFiles = ['dist/index.js', 'dist/public/index.html'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing required file: ${file}`);
      }
    }
    
    console.log('🎉 Deployment build successful!');
    console.log('📁 Output files:');
    console.log('  - dist/index.js (ES module server)');
    console.log('  - dist/public/ (client application)');
    
  } catch (error) {
    console.error('❌ Deployment build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();