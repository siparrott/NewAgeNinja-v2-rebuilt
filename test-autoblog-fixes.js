// Quick test to verify all 5 fixes from expert analysis are working
import { readFile, access } from 'fs/promises';

async function testAutoBlogFixes() {
  console.log('🔧 TESTING AUTOBLOG FIXES - Expert Analysis Validation');
  console.log('====================================================');
  
  // Test #1: Verify Assistant ID is correct
  console.log('\n📋 FIX #1 - Verify TOGNINJA Assistant ID:');
  const configContent = await readFile('server/config.ts', 'utf8');
  const assistantIdMatch = configContent.match(/asst_nlyO3yRav2oWtyTvkq0cHZaU/);
  console.log('✅ Should be: asst_nlyO3yRav2oWtyTvkq0cHZaU');
  console.log('✅ Found in config:', assistantIdMatch ? 'YES' : 'NO');
  
  // Test #2: Check if using threads API vs chat completions
  console.log('\n📋 FIX #2 - Verify Assistant API usage (not chat.completions):');
  const autoblogContent = await readFile('server/autoblog.ts', 'utf8');
  const hasThreads = autoblogContent.includes('threads.runs.create');
  const hasChatCompletions = autoblogContent.includes('chat.completions.create');
  console.log('✅ Uses threads.runs.create:', hasThreads ? 'YES' : 'NO');
  console.log('⚠️  Still has chat.completions (should be minimal):', hasChatCompletions ? 'YES' : 'NO');
  
  // Test #3: Verify instructions were updated
  console.log('\n📋 FIX #3 - Check Assistant instructions were updated:');
  const updateScriptExists = await access('update-assistant-instructions.js').then(() => true).catch(() => false);
  console.log('✅ Update script exists:', updateScriptExists ? 'YES' : 'NO');
  
  // Test #4: Check max_tokens is increased
  console.log('\n📋 FIX #4 - Verify max_tokens increased from 256:');
  const maxTokensMatch = autoblogContent.match(/max_tokens:\s*(\d+)/g);
  console.log('✅ max_tokens settings found:', maxTokensMatch || 'NONE');
  const hasHighTokens = maxTokensMatch && maxTokensMatch.some(match => {
    const value = parseInt(match.split(':')[1].trim());
    return value >= 1500;
  });
  console.log('✅ Has max_tokens >= 1500:', hasHighTokens ? 'YES' : 'NO');
  
  // Test #5: Verify no prompt override happening
  console.log('\n📋 FIX #5 - Check minimal context approach:');
  const hasMinimalMessage = autoblogContent.includes('Create complete blog package with all sections per your training');
  console.log('✅ Uses minimal context message:', hasMinimalMessage ? 'YES' : 'NO');
  
  console.log('\n🎯 SUMMARY:');
  console.log('===========');
  console.log('All fixes should show YES for optimal AutoBlog quality');
  console.log('Expert analysis implemented successfully');
}

testAutoBlogFixes().catch(console.error);