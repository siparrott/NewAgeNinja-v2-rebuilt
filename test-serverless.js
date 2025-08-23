// Simple test to verify the Express app exports correctly for serverless
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function testServerlessExport() {
  try {
    console.log('Testing serverless export...');
    
    // This simulates how Vercel will import your function
    const app = await import('./server/index.js');
    
    if (app.default && typeof app.default === 'function') {
      console.log('✅ SUCCESS: Express app exports correctly for serverless deployment');
      console.log('✅ App has', app.default._router ? app.default._router.stack.length : 'unknown', 'routes registered');
      return true;
    } else {
      console.log('❌ FAILED: No default export found or export is not a function');
      console.log('Available exports:', Object.keys(app));
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('This might indicate import/compilation issues');
    return false;
  }
}

testServerlessExport().then(success => {
  if (success) {
    console.log('🚀 Ready for Vercel deployment!');
  } else {
    console.log('⚠️ Needs additional fixes before deployment');
  }
  process.exit(success ? 0 : 1);
});
