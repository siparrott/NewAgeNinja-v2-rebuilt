// Direct test of CRM agent system
console.log('🔍 Testing CRM Agent System...');

const testData = {
  studioId: "e5dc81e8-7073-4041-8814-affb60f4ef6c",
  userId: "admin",
  message: "How many leads do we have?"
};

async function testCrmAgent() {
  try {
    const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-session=test-session'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('Agent Response:', result.response);
    
    // Test API endpoint directly
    const leadsResponse = await fetch('http://localhost:5000/api/crm/leads', {
      headers: { 'Cookie': 'auth-session=test-session' }
    });
    const leads = await leadsResponse.json();
    console.log('✅ Direct API: Found', leads.length, 'leads');
    console.log('First lead:', leads[0]?.name, leads[0]?.email);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCrmAgent();
