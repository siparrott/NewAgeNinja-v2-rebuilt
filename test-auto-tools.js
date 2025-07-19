// Test auto-generated tools are working
async function testAutoTools() {
  console.log('🛠️ TESTING AUTO-GENERATED TOOLS');
  console.log('===============================');
  
  const testCases = [
    {
      name: "Search Simon Parrott", 
      message: "search for simon parrott",
      expectSearch: true
    },
    {
      name: "List Leads",
      message: "list all leads", 
      expectData: true
    },
    {
      name: "Count Invoices",
      message: "how many invoices do we have",
      expectCount: true
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);
    
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
          userId: 'test-auto-' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Status:', response.status);
      if (result.response) {
        console.log('✅ Response Length:', result.response.length);
        
        const responseText = result.response.toLowerCase();
        const hasSimon = responseText.includes('simon') && responseText.includes('parrott');
        const hasResults = responseText.includes('found') || responseText.includes('results');
        const hasNumbers = /\d+/.test(responseText);
        const hasError = responseText.includes('error') || responseText.includes('failed') || responseText.includes('nicht verfügbar');
        
        console.log('🔍 Analysis:');
        console.log('  - Mentions Simon Parrott:', hasSimon ? 'YES' : 'NO');
        console.log('  - Shows search results:', hasResults ? 'YES' : 'NO');
        console.log('  - Contains numbers/counts:', hasNumbers ? 'YES' : 'NO');
        console.log('  - Shows errors:', hasError ? 'YES' : 'NO');
        
        if (testCase.expectSearch && hasSimon && hasResults && !hasError) {
          console.log('🎉 SUCCESS: Search working!');
        } else if (testCase.expectData && hasResults && !hasError) {
          console.log('🎉 SUCCESS: Data retrieval working!');
        } else if (testCase.expectCount && hasNumbers && !hasError) {
          console.log('🎉 SUCCESS: Count working!');
        } else if (hasError) {
          console.log('❌ ISSUE: System reporting errors');
        } else {
          console.log('⚠️ MIXED: Partial functionality detected');
        }
        
        console.log('📄 First 150 chars:', result.response.substring(0, 150) + '...');
      } else {
        console.log('❌ No response received');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
  
  console.log('\n🏁 Auto-generated tools testing complete!');
}

testAutoTools();