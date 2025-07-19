// Test Simon Parrott search with specific search terms
async function testSimonSearchSpecific() {
  console.log('🔍 TESTING SIMON PARROTT SEARCH - SPECIFIC TERMS');
  console.log('===============================================');
  
  const searchTerms = [
    'simon',
    'parrott', 
    'simon parrott',
    'list all leads'
  ];
  
  for (const term of searchTerms) {
    console.log(`\n📝 Testing search: "${term}"`);
    
    try {
      const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-session=test-session'
        },
        body: JSON.stringify({
          message: term,
          studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
          userId: 'test-user-search-' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Status:', response.status);
      if (result.response) {
        const responseText = result.response.toLowerCase();
        const foundSimon = responseText.includes('simon');
        const foundParrott = responseText.includes('parrott');
        const foundEmail = responseText.includes('siparrott@yahoo.co.uk');
        const foundError = responseText.includes('error') || responseText.includes('failed');
        
        console.log('✅ Response Length:', result.response.length);
        console.log('🔍 Analysis:');
        console.log('  - Mentions Simon:', foundSimon ? 'YES' : 'NO');
        console.log('  - Mentions Parrott:', foundParrott ? 'YES' : 'NO');
        console.log('  - Shows correct email:', foundEmail ? 'YES' : 'NO');
        console.log('  - Reports errors:', foundError ? 'YES' : 'NO');
        
        if (foundSimon && foundParrott && foundEmail) {
          console.log('🎉 SUCCESS: Found Simon Parrott with correct email!');
        }
      } else {
        console.log('❌ No response received');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
}

testSimonSearchSpecific();