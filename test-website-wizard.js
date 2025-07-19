const fetch = require('node-fetch');

async function testWebsiteWizard() {
  try {
    console.log('Testing Website Wizard API...');
    
    const response = await fetch('http://localhost:5000/api/website-wizard/tool-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'website-profile',
        args: {
          url: 'https://example.com',
          action: 'analyze'
        }
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Website Wizard API is working properly!');
    } else {
      console.log('❌ Website Wizard API returned an error');
    }
    
  } catch (error) {
    console.error('Error testing Website Wizard:', error.message);
  }
}

testWebsiteWizard();