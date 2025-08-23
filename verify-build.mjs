#!/usr/bin/env node

// Verification script to check all TypeScript files compile correctly
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🔍 Verifying TypeScript compilation...');

try {
  // Check TypeScript compilation
  execSync('npx tsc --noEmit --project tsconfig.json', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation: PASSED');
} catch (error) {
  console.log('❌ TypeScript compilation: FAILED');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

try {
  // Check if core files exist and are valid
  const coreFiles = [
    'server/app.ts',
    'api/index.ts', 
    'server/routes/index.ts',
    'server/supabase.ts',
    'vercel.json'
  ];
  
  for (const file of coreFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing core file: ${file}`);
    }
  }
  console.log('✅ Core files: ALL PRESENT');
} catch (error) {
  console.log('❌ Core files check: FAILED');
  console.log(error.message);
  process.exit(1);
}

try {
  // Test API entry point can be imported
  execSync('npx tsx --check api/index.ts', { stdio: 'pipe' });
  console.log('✅ API entry point: VALID');
} catch (error) {
  console.log('❌ API entry point: FAILED');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

console.log('\n🎉 ALL CHECKS PASSED - Workspace is ready for deployment!');
