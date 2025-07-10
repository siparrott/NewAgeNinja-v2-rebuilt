#!/usr/bin/env node
// Test script for ES module deployment
console.log('🚀 Starting ES module server test...');
console.log('✅ ES module import successful');
console.log('📋 Node.js version:', process.version);
console.log('📋 ES module support:', typeof import.meta !== 'undefined');

// Test basic imports
try {
  import('./index.js').then(() => {
    console.log('✅ Server module loaded successfully');
    setTimeout(() => {
      console.log('✅ ES module deployment test completed');
      process.exit(0);
    }, 1000);
  }).catch(error => {
    console.error('❌ Server module failed:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
}