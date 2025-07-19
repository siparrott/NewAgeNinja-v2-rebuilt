// Test direct Simon Parrott search via CRM agent 
async function testDirectSimonSearch() {
  console.log('🔍 TESTING DIRECT SIMON PARROTT SEARCH');
  console.log('=====================================');
  
  try {
    // Test the search functionality directly
    console.log('📝 Testing: "search for simon parrott"');
    
    const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-session=test-session'
      },
      body: JSON.stringify({
        message: 'search for simon parrott in leads',
        studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
        userId: 'test-user-id-2'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 API Response Status:', response.status);
    console.log('✅ Agent Response:', result.response);
    
    if (result.response && result.response.length > 100) {
      console.log('🎉 SUCCESS: Agent provided detailed response');
      
      // Check if Simon Parrott was found
      const response_text = result.response.toLowerCase();
      if (response_text.includes('simon') && response_text.includes('parrott')) {
        console.log('✅ FOUND: Simon Parrott mentioned in response');
        if (response_text.includes('siparrott@yahoo.co.uk')) {
          console.log('✅ EMAIL FIXED: Correct email address displayed');
        }
      } else {
        console.log('❌ NOT FOUND: Simon Parrott not mentioned in response');
      }
    } else {
      console.log('❌ ISSUE: Agent response too short or empty');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDirectSimonSearch();