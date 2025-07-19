// Test the Replit-style super-agent execution with detailed logging
async function testReplitAgent() {
  console.log('🤖 TESTING REPLIT-STYLE SUPER-AGENT');
  console.log('===================================');
  
  const testCases = [
    "find simon parrott",
    "search for simon", 
    "list all leads",
    "show me simon's email"
  ];
  
  for (const message of testCases) {
    console.log(`\n📝 Testing: "${message}"`);
    
    try {
      const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-session=test-session'
        },
        body: JSON.stringify({
          message,
          studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
          userId: 'test-replit-' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Status:', response.status);
      console.log('✅ Response:', result.response);
      
      // Check for autonomous execution
      const hasAutonomous = result.response.includes('autonomous') || result.response.includes('search');
      const hasSimon = result.response.toLowerCase().includes('simon');
      const hasError = result.response.toLowerCase().includes('error') || result.response.toLowerCase().includes('failed');
      const hasEmail = result.response.toLowerCase().includes('siparrott');
      const hasData = result.response.toLowerCase().includes('found') || result.response.includes('lead');
      
      console.log('🔍 Analysis:');
      console.log('  - Autonomous execution:', hasAutonomous ? 'YES' : 'NO');
      console.log('  - Mentions Simon:', hasSimon ? 'YES' : 'NO');
      console.log('  - Shows email address:', hasEmail ? 'YES' : 'NO'); 
      console.log('  - Shows data/results:', hasData ? 'YES' : 'NO');
      console.log('  - Reports errors:', hasError ? 'YES' : 'NO');
      
      if (hasSimon && hasEmail && hasData && !hasError) {
        console.log('🎉 SUCCESS: Replit-style agent working perfectly!');
        break; // Stop on first success
      } else if (hasData && !hasError) {
        console.log('✅ PROGRESS: Agent returning some data');
      } else if (hasError) {
        console.log('❌ ERROR: Agent reporting errors');
      } else {
        console.log('⚠️ ISSUE: Agent not finding data properly');
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
  
  console.log('\n🏁 Replit-style super-agent testing complete!');
}

testReplitAgent();