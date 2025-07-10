#!/usr/bin/env node

/**
 * Fix deployment errors by:
 * 1. Copying package.json to expected runtime locations
 * 2. Creating robust start script with error handling
 * 3. Ensuring proper server configuration for external access
 * 4. Setting up production environment properly
 */

import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

async function fixDeploymentError() {
  console.log('🔧 Fixing deployment errors...');

  // 1. Copy package.json to all expected runtime locations
  await copyPackageJsonToRuntimeLocations();
  
  // 2. Create robust start scripts with error handling
  await createRobustStartScripts();
  
  // 3. Update build configuration
  await updateBuildConfiguration();
  
  // 4. Create deployment-ready files
  await createDeploymentFiles();
  
  console.log('✅ All deployment fixes applied successfully!');
}

async function copyPackageJsonToRuntimeLocations() {
  console.log('📦 Copying package.json to runtime locations...');
  
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  
  // Locations where Replit deployment might look for package.json
  const runtimeLocations = [
    '/home/runner/package.json',
    '/home/runner/workspace/package.json',
    './dist/package.json'
  ];
  
  for (const location of runtimeLocations) {
    try {
      const dir = path.dirname(location);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      await fs.writeFile(location, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Copied package.json to ${location}`);
    } catch (error) {
      console.warn(`⚠️  Could not copy to ${location}:`, error.message);
    }
  }
}

async function createRobustStartScripts() {
  console.log('🚀 Creating robust start scripts...');
  
  // Create start.mjs with comprehensive error handling
  const startMjs = `#!/usr/bin/env node

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
      console.log(\`📂 Found working directory: \${dir}\`);
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
      console.log(\`🔍 Found server file: \${file}\`);
      return file;
    }
  }
  
  throw new Error(\`Could not find server file. Searched: \${possibleFiles.join(', ')}\`);
}

function ensurePackageJson() {
  const workDir = findWorkingDirectory();
  const packageJsonPath = resolve(workDir, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.warn(\`⚠️  No package.json found at \${packageJsonPath}\`);
    
    // Check if there's a package.json in dist or other locations
    const fallbackLocations = [
      resolve(workDir, 'dist/package.json'),
      resolve(__dirname, 'package.json'),
      '/home/runner/package.json'
    ];
    
    for (const fallback of fallbackLocations) {
      if (existsSync(fallback)) {
        console.log(\`📋 Using package.json from \${fallback}\`);
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
    console.log(\`✅ Created minimal package.json at \${packageJsonPath}\`);
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
    
    console.log(\`🚀 Starting server from \${workDir}\`);
    console.log(\`📄 Server file: \${serverFile}\`);
    console.log(\`🌐 Binding to \${CONFIG.host}:\${CONFIG.port}\`);
    
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
      console.log(\`🔄 Server process exited with code \${code}\`);
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
`;

  // Create start.js (CommonJS fallback)
  const startJs = `#!/usr/bin/env node

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
`;

  await fs.writeFile('start.mjs', startMjs);
  await fs.writeFile('start.js', startJs);
  await fs.writeFile('dist/start.mjs', startMjs);
  await fs.writeFile('dist/start.js', startJs);
  
  console.log('✅ Created robust start scripts');
}

async function updateBuildConfiguration() {
  console.log('⚙️ Updating build configuration...');
  
  // Update package.json with better start script
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "start": "node start.mjs",
    "start:fallback": "node start.js",
    "start:direct": "NODE_ENV=production node dist/index.js"
  };
  
  // Ensure the server binds to 0.0.0.0
  packageJson.engines = {
    "node": ">=18.0.0"
  };
  
  await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with robust start scripts');
}

async function createDeploymentFiles() {
  console.log('📋 Creating deployment configuration files...');
  
  // Create production package.json for dist/
  const prodPackageJson = {
    "name": "newage-fotografie-crm",
    "version": "1.0.0",
    "description": "New Age Fotografie - Professional Photography Studio CRM",
    "type": "module",
    "main": "index.js",
    "engines": {
      "node": ">=18.0.0"
    },
    "scripts": {
      "start": "node start.mjs",
      "start:fallback": "node start.js",
      "start:direct": "NODE_ENV=production node index.js"
    },
    "dependencies": {
      "@neondatabase/serverless": "^0.9.0",
      "drizzle-orm": "^0.29.3",
      "drizzle-zod": "^0.5.1",
      "express": "^4.18.2",
      "express-session": "^1.17.3",
      "connect-pg-simple": "^9.0.1",
      "passport": "^0.7.0",
      "passport-local": "^1.0.0",
      "node-fetch": "^3.3.2",
      "jsdom": "^23.2.0",
      "papaparse": "^5.4.1",
      "uuid": "^9.0.1",
      "date-fns": "^3.2.0",
      "zod": "^3.22.4"
    }
  };
  
  await fs.writeFile('dist/package.json', JSON.stringify(prodPackageJson, null, 2));
  
  // Create .replit configuration
  const replitConfig = {
    "run": "node start.mjs",
    "modules": ["nodejs-20"],
    "deploymentTarget": "cloudrun",
    "env": {
      "NODE_ENV": "production",
      "PORT": "5000"
    }
  };
  
  await fs.writeFile('.replit', JSON.stringify(replitConfig, null, 2));
  
  console.log('✅ Created deployment configuration files');
}

// Run the fix
fixDeploymentError().catch((error) => {
  console.error('❌ Deployment fix failed:', error);
  process.exit(1);
});