// Test the enhanced lead search tools directly
async function testEnhancedLeadTools() {
  console.log('🔍 TESTING ENHANCED LEAD TOOLS');
  console.log('===============================');
  
  const testCases = [
    {
      name: "Enhanced Read CRM Leads",
      message: "use read_crm_leads to search for simon",
      tool: "read_crm_leads"
    },
    {
      name: "Find Lead Tool", 
      message: "use find_lead to get siparrott@yahoo.co.uk",
      tool: "find_lead"
    },
    {
      name: "Enumerate Leads",
      message: "use enumerate_leads_basic to list all leads",
      tool: "enumerate_leads_basic"
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
          userId: 'test-enhanced-' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Status:', response.status);
      console.log('✅ Response Length:', result.response.length);
      console.log('📄 Response:', result.response.substring(0, 300) + (result.response.length > 300 ? '...' : ''));
      
      const hasSimon = result.response.toLowerCase().includes('simon');
      const hasEmail = result.response.toLowerCase().includes('siparrott');
      const hasData = result.response.toLowerCase().includes('found') || result.response.toLowerCase().includes('results');
      const hasError = result.response.toLowerCase().includes('error') || result.response.toLowerCase().includes('failed');
      
      console.log('🔍 Analysis:');
      console.log('  - Mentions Simon:', hasSimon ? 'YES' : 'NO');
      console.log('  - Shows email address:', hasEmail ? 'YES' : 'NO');
      console.log('  - Shows data/results:', hasData ? 'YES' : 'NO');
      console.log('  - Reports errors:', hasError ? 'YES' : 'NO');
      
      if (hasSimon && hasEmail && hasData && !hasError) {
        console.log('🎉 SUCCESS: Enhanced tool working perfectly!');
      } else if (hasData && !hasError) {
        console.log('✅ GOOD: Tool returning data successfully');
      } else if (hasError) {
        console.log('❌ ERROR: Tool reporting errors');
      } else {
        console.log('⚠️ MIXED: Tool functioning but may need adjustments');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
  
  console.log('\n🏁 Enhanced lead tools testing complete!');
}

testEnhancedLeadTools();