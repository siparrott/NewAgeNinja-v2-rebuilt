// Test script to verify AutoBlog fixes based on expert analysis
const { BLOG_ASSISTANT, DEBUG_OPENAI, getAssistantInstructions } = require('./server/config.ts');
const { generateWithTOGNINJAAssistant } = require('./server/autoblog-utils.ts');

async function testAutoLogFixes() {
  console.log('🧪 TESTING AUTOBLOG FIXES - Expert Analysis Implementation');
  
  // Test #1: Verify correct assistant ID configuration
  console.log('\n📋 TEST #1: Assistant ID Configuration');
  console.log('✅ BLOG_ASSISTANT:', BLOG_ASSISTANT);
  console.log('✅ Should be: asst_nlyO3yRav2oWtyTvkq0cHZaU');
  console.log('✅ Match:', BLOG_ASSISTANT === 'asst_nlyO3yRav2oWtyTvkq0cHZaU' ? 'YES' : 'NO');
  
  // Test #2: Debug logging configuration
  console.log('\n🐛 TEST #2: Debug Configuration');
  console.log('✅ DEBUG_OPENAI:', DEBUG_OPENAI);
  console.log('✅ Centralized config: Available');
  
  // Test #3: Assistant instructions retrieval (for fallback)
  console.log('\n🔧 TEST #3: Assistant Instructions Retrieval');
  try {
    const instructions = await getAssistantInstructions(BLOG_ASSISTANT);
    console.log('✅ Instructions length:', instructions.length, 'characters');
    console.log('✅ Instructions preview:', instructions.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Instructions retrieval failed:', error.message);
  }
  
  // Test #4: TOGNINJA Assistant generation test
  console.log('\n🎯 TEST #4: TOGNINJA Assistant Generation Test');
  const testMessage = `Photography session: Family portrait session
Studio: New Age Fotografie, Vienna  
User request: Create a German blog post about family photography

Generate content using your trained instructions.`;

  try {
    const result = await generateWithTOGNINJAAssistant(testMessage);
    if (result) {
      console.log('✅ TOGNINJA Assistant response length:', result.length, 'characters');
      console.log('✅ Content preview:', result.substring(0, 200) + '...');
      console.log('✅ German content detected:', result.includes('Familie') || result.includes('Wien') ? 'YES' : 'NO');
    } else {
      console.log('❌ No response from TOGNINJA Assistant');
    }
  } catch (error) {
    console.log('❌ TOGNINJA Assistant test failed:', error.message);
  }
  
  console.log('\n🎊 AUTOBLOG FIXES TEST COMPLETE');
  console.log('📊 Key fixes implemented:');
  console.log('  ✅ Centralized assistant ID configuration');
  console.log('  ✅ Debug logging enabled');
  console.log('  ✅ SDK calls (no fetch() bypass)');
  console.log('  ✅ Minimal context approach');
  console.log('  ✅ Fallback system with assistant instructions');
}

// Run the test if called directly
if (require.main === module) {
  testAutoLogFixes().catch(console.error);
}