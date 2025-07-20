// Direct test of Prodigi API with the provided key
import fetch from 'node-fetch';

const PRODIGI_API_KEY = 'c14420b0-bb43-4915-80fd-1c84d0c0678f';
const PRODIGI_ENDPOINT = 'https://api.sandbox.prodigi.com/v4.0';

async function testProdigiAuth() {
  console.log('🔑 Testing Prodigi authentication...');
  
  try {
    // Test 1: Basic auth check
    const authResponse = await fetch(`${PRODIGI_ENDPOINT}/orders`, {
      method: 'GET',
      headers: {
        'X-API-Key': PRODIGI_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Auth test status: ${authResponse.status}`);
    const authText = await authResponse.text();
    console.log(`📄 Auth response: ${authText.substring(0, 200)}...`);
    
    // Test 2: Try alternative header format
    const authResponse2 = await fetch(`${PRODIGI_ENDPOINT}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRODIGI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Bearer auth status: ${authResponse2.status}`);
    const authText2 = await authResponse2.text();
    console.log(`📄 Bearer response: ${authText2.substring(0, 200)}...`);
    
    // Test 3: Check if it's a valid sandbox environment
    console.log(`🔧 Testing sandbox endpoint: ${PRODIGI_ENDPOINT}`);
    
  } catch (error) {
    console.error('❌ Prodigi test failed:', error.message);
  }
}

testProdigiAuth();