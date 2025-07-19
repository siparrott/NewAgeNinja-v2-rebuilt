// Test the complete Simon Parrott email fix according to triage playbook
import fs from 'fs/promises';

async function testSimonEmailFix() {
  console.log('🧪 TESTING SIMON PARROTT EMAIL FIX');
  console.log('==================================');
  
  try {
    // Test the CRM agent with Simon Parrott email scenario
    console.log('📝 Testing: "send Simon Parrott an email confirming his appointment"');
    
    const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-session=test-session'
      },
      body: JSON.stringify({
        message: 'send Simon Parrott an email confirming his appointment',
        studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
        userId: 'test-user-id'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 API Response Status:', response.status);
    
    if (response.status === 200 && result.response) {
      console.log('✅ Agent Response Length:', result.response.length, 'characters');
      console.log('📄 Agent Response Preview:', result.response.substring(0, 300) + '...');
      
      // Check if agent mentioned email issues or search results
      const response_text = result.response.toLowerCase();
      const foundSimon = response_text.includes('simon');
      const foundEmail = response_text.includes('email') || response_text.includes('e-mail');
      const foundSearch = response_text.includes('found') || response_text.includes('search');
      const foundError = response_text.includes('error') || response_text.includes('invalid');
      
      console.log('🔍 Analysis:');
      console.log('  - Mentions Simon:', foundSimon ? 'YES' : 'NO');
      console.log('  - Mentions email:', foundEmail ? 'YES' : 'NO');
      console.log('  - Shows search results:', foundSearch ? 'YES' : 'NO');
      console.log('  - Reports errors:', foundError ? 'YES' : 'NO');
      
      if (foundSimon && foundEmail && !foundError) {
        console.log('🎉 SUCCESS: Agent handled Simon Parrott email request without errors');
      } else if (foundError) {
        console.log('⚠️ ISSUE: Agent still reporting email errors after fix');
      } else {
        console.log('❓ UNCLEAR: Agent response needs manual review');
      }
      
    } else {
      console.log('❌ CRM Agent request failed:', result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimonEmailFix();