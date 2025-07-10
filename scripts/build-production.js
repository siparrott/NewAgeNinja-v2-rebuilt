#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { buildServer } from '../esbuild.config.js';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function ensureDirectories() {
  try {
    await fs.mkdir('dist', { recursive: true });
    await fs.mkdir('dist/public', { recursive: true });
    console.log('✅ Build directories created');
  } catch (error) {
    // Directories might already exist
  }
}

async function buildClient() {
  console.log('🔨 Building client with Vite...');
  try {
    // Set production environment
    process.env.NODE_ENV = 'production';
    
    const { stdout, stderr } = await execAsync('npx vite build', {
      timeout: 120000 // 2 minute timeout
    });
    
    if (stderr && !stderr.includes('warning') && !stderr.includes('Browserslist')) {
      console.warn('Client build warnings:', stderr);
    }
    
    console.log('✅ Client build completed');
    return true;
  } catch (error) {
    console.error('❌ Client build failed:', error.message);
    return false;
  }
}

async function buildServerWithESM() {
  console.log('🔨 Building server with ES modules...');
  try {
    await buildServer();
    console.log('✅ Server build completed');
    return true;
  } catch (error) {
    console.error('❌ Server build failed:', error.message);
    return false;
  }
}

async function createStartScript() {
  const startScript = `#!/usr/bin/env node
// Production start script for ES modules
import('./index.js').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});`;

  try {
    await fs.writeFile('dist/start.js', startScript);
    console.log('✅ Start script created');
  } catch (error) {
    console.error('❌ Failed to create start script:', error.message);
  }
}

async function validateBuild() {
  try {
    const clientFiles = await fs.readdir('dist/public');
    const serverExists = await fs.access('dist/index.js').then(() => true).catch(() => false);
    
    if (clientFiles.length > 0 && serverExists) {
      console.log('✅ Build validation passed');
      console.log(`📁 Client files: ${clientFiles.length} files in dist/public/`);
      console.log('📁 Server file: dist/index.js');
      return true;
    } else {
      console.error('❌ Build validation failed - missing files');
      return false;
    }
  } catch (error) {
    console.error('❌ Build validation error:', error.message);
    return false;
  }
}

async function buildProduction() {
  console.log('🚀 Starting production build...');
  
  await ensureDirectories();
  
  const clientSuccess = await buildClient();
  if (!clientSuccess) {
    console.error('❌ Production build failed at client stage');
    process.exit(1);
  }
  
  const serverSuccess = await buildServerWithESM();
  if (!serverSuccess) {
    console.error('❌ Production build failed at server stage');
    process.exit(1);
  }
  
  await createStartScript();
  
  const isValid = await validateBuild();
  if (!isValid) {
    console.error('❌ Production build validation failed');
    process.exit(1);
  }
  
  console.log('🎉 Production build completed successfully!');
  console.log('📦 Ready for deployment with ES module support');
  console.log('🚀 Start with: node dist/start.js');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildProduction().catch((error) => {
    console.error('Production build failed:', error);
    process.exit(1);
  });
}

export { buildProduction };