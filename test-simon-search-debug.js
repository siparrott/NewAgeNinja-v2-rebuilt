// Test Simon search with detailed debugging
async function testSimonSearch() {
  console.log('🔍 TESTING SIMON SEARCH WITH DEBUG OUTPUT');
  console.log('=========================================');
  
  const testMessages = [
    "find simon parrott",
    "search for simon",
    "show me leads named simon parrott",
    "list all leads"
  ];
  
  for (const message of testMessages) {
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
          userId: 'test-simon-debug-' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Status:', response.status);
      console.log('✅ Response:', result.response);
      
      // Look for specific indicators
      const hasSimon = result.response.toLowerCase().includes('simon');
      const hasError = result.response.toLowerCase().includes('error') || result.response.toLowerCase().includes('failed');
      const hasFound = result.response.toLowerCase().includes('found') || result.response.toLowerCase().includes('results');
      const hasEmail = result.response.toLowerCase().includes('siparrott');
      
      console.log('🔍 Analysis:');
      console.log('  - Mentions Simon:', hasSimon ? 'YES' : 'NO');
      console.log('  - Shows email address:', hasEmail ? 'YES' : 'NO');
      console.log('  - Shows "found" results:', hasFound ? 'YES' : 'NO');
      console.log('  - Reports errors:', hasError ? 'YES' : 'NO');
      
      if (hasSimon && hasEmail && hasFound && !hasError) {
        console.log('🎉 SUCCESS: Simon found correctly!');
      } else if (hasError) {
        console.log('❌ ERROR: System reporting errors');
      } else {
        console.log('⚠️ ISSUE: Simon search not working properly');
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
  
  console.log('\n🏁 Simon search debugging complete!');
}

testSimonSearch();