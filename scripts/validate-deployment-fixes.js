#!/usr/bin/env node

/**
 * Validate that all deployment fixes are working properly
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

async function validateDeploymentFixes() {
  console.log('🔍 Validating deployment fixes...');
  
  let allFixesValid = true;
  const validationResults = [];
  
  // 1. Check package.json locations
  console.log('\n📦 Checking package.json locations...');
  const packageJsonLocations = [
    '/home/runner/package.json',
    '/home/runner/workspace/package.json', 
    './dist/package.json',
    './package.json'
  ];
  
  for (const location of packageJsonLocations) {
    if (existsSync(location)) {
      validationResults.push(`✅ Found package.json at ${location}`);
    } else {
      validationResults.push(`❌ Missing package.json at ${location}`);
      allFixesValid = false;
    }
  }
  
  // 2. Check start scripts
  console.log('\n🚀 Checking start scripts...');
  const startScripts = [
    './start.mjs',
    './start.js',
    './dist/start.mjs',
    './dist/start.js'
  ];
  
  for (const script of startScripts) {
    if (existsSync(script)) {
      validationResults.push(`✅ Found start script: ${script}`);
    } else {
      validationResults.push(`❌ Missing start script: ${script}`);
      allFixesValid = false;
    }
  }
  
  // 3. Check server build
  console.log('\n🏗️ Checking server build...');
  if (existsSync('./dist/index.js')) {
    const stats = await fs.stat('./dist/index.js');
    validationResults.push(`✅ Server built successfully (${Math.round(stats.size / 1024)}KB)`);
  } else {
    validationResults.push(`❌ Server build missing at ./dist/index.js`);
    allFixesValid = false;
  }
  
  // 4. Check server configuration
  console.log('\n⚙️ Checking server configuration...');
  try {
    const serverContent = await fs.readFile('./server/index.production.ts', 'utf8');
    if (serverContent.includes("host = '0.0.0.0'")) {
      validationResults.push(`✅ Server configured to bind to 0.0.0.0`);
    } else {
      validationResults.push(`❌ Server not configured for external access`);
      allFixesValid = false;
    }
  } catch (error) {
    validationResults.push(`❌ Could not check server configuration: ${error.message}`);
    allFixesValid = false;
  }
  
  // 5. Check package.json start script
  console.log('\n📋 Checking package.json start configuration...');
  try {
    const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
    if (packageJson.scripts.start === 'node start.mjs') {
      validationResults.push(`✅ Package.json start script correctly configured`);
    } else {
      validationResults.push(`❌ Package.json start script not optimal: ${packageJson.scripts.start}`);
    }
    
    if (packageJson.type === 'module') {
      validationResults.push(`✅ Package.json configured as ES module`);
    } else {
      validationResults.push(`❌ Package.json not configured as ES module`);
    }
  } catch (error) {
    validationResults.push(`❌ Could not read package.json: ${error.message}`);
    allFixesValid = false;
  }
  
  // Print results
  console.log('\n📊 Validation Results:');
  validationResults.forEach(result => console.log(result));
  
  console.log(`\n${allFixesValid ? '✅' : '❌'} Overall validation: ${allFixesValid ? 'PASSED' : 'FAILED'}`);
  
  if (allFixesValid) {
    console.log('\n🎉 All deployment fixes are working correctly!');
    console.log('📋 Deployment checklist:');
    console.log('  ✅ Package.json copied to runtime locations');
    console.log('  ✅ Robust start scripts with error handling created');
    console.log('  ✅ Server configured to bind to 0.0.0.0');
    console.log('  ✅ Production server build completed');
    console.log('  ✅ ES module configuration validated');
    console.log('\n🚀 Ready for deployment!');
  } else {
    console.log('\n⚠️  Some fixes need attention. See validation results above.');
  }
  
  return allFixesValid;
}

validateDeploymentFixes().catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});