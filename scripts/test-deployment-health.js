#!/usr/bin/env node

import https from 'https';

const testEndpoint = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

async function runHealthCheck() {
  console.log('🔍 Testing deployment health...');
  
  try {
    const result = await testEndpoint('https://www.newagefotografie.com/api/health');
    console.log('Status Code:', result.statusCode);
    console.log('Response:', result.data);
    
    if (result.statusCode === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
}

runHealthCheck();
