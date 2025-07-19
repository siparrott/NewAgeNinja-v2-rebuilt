// Test a very simple CRM agent query to identify the error
async function testSimpleCRMAgent() {
  console.log('🧪 TESTING SIMPLE CRM AGENT QUERY');
  console.log('=================================');
  
  try {
    const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-session=test-session'
      },
      body: JSON.stringify({
        message: 'hello',
        studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
        userId: 'test-user-simple'
      })
    });
    
    const result = await response.text();
    
    console.log('📊 API Response Status:', response.status);
    console.log('📄 Raw Response:', result.substring(0, 500));
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('✅ JSON Response:', jsonResult.response ? 'SUCCESS' : 'ERROR');
    } catch (e) {
      console.log('❌ Invalid JSON Response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleCRMAgent();