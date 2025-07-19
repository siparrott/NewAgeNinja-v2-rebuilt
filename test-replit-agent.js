// Test the new Replit-style super-agent with complex multi-step operations
async function testReplitStyleAgent() {
  console.log('🚀 TESTING REPLIT-STYLE SUPER-AGENT');
  console.log('===================================');
  
  const testCases = [
    {
      name: "Simple Search",
      message: "find simon parrott",
      expected: "Should autonomously search and find Simon"
    },
    {
      name: "Complex Email Request", 
      message: "Send Simon Parrott an email about his appointment",
      expected: "Should search → find → email autonomously"
    },
    {
      name: "Data Query",
      message: "how many invoices do we have this year",
      expected: "Should search invoices and provide count"
    },
    {
      name: "Update Request",
      message: "list all leads with status new",
      expected: "Should read leads with filtering"
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-session=test-session'
        },
        body: JSON.stringify({
          message: testCase.message,
          studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
          userId: 'test-replit-' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Status:', response.status);
      if (result.response) {
        console.log('✅ Response Length:', result.response.length);
        console.log('📄 Response:', result.response.substring(0, 200) + (result.response.length > 200 ? '...' : ''));
        
        // Check for autonomous execution indicators
        const hasSearch = result.response.toLowerCase().includes('found') || result.response.toLowerCase().includes('search');
        const hasAction = result.response.toLowerCase().includes('sent') || result.response.toLowerCase().includes('created') || result.response.toLowerCase().includes('updated');
        const hasError = result.response.toLowerCase().includes('error') || result.response.toLowerCase().includes('failed');
        
        console.log('🔍 Analysis:');
        console.log('  - Shows search/find action:', hasSearch ? 'YES' : 'NO');
        console.log('  - Shows autonomous action:', hasAction ? 'YES' : 'NO');
        console.log('  - Reports errors:', hasError ? 'YES' : 'NO');
        
        if (hasSearch && !hasError) {
          console.log('🎉 SUCCESS: Autonomous execution detected!');
        }
      } else {
        console.log('❌ No response received');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('---');
  }
  
  console.log('\n🏁 Replit-style super-agent testing complete!');
}

testReplitStyleAgent();