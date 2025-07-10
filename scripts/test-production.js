#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testProductionBuild() {
  console.log('🧪 Testing production build...');
  
  try {
    // Set production environment and use different port
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3001',
      DEMO_MODE: 'false'
    };
    
    console.log('🚀 Starting production server on port 3001...');
    const { stdout, stderr } = await execAsync('timeout 10s node dist/index.js', {
      env,
      timeout: 15000
    });
    
    if (stdout) {
      console.log('📋 Server output:', stdout);
    }
    
    if (stderr && !stderr.includes('warning')) {
      console.log('⚠️ Server stderr:', stderr);
    }
    
    console.log('✅ Production build test completed');
  } catch (error) {
    if (error.signal === 'SIGTERM') {
      console.log('✅ Server started successfully (terminated after timeout)');
    } else {
      console.error('❌ Production test failed:', error.message);
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testProductionBuild().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}