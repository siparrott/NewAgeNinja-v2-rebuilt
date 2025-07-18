#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testOriginalAutoBlog() {
  try {
    console.log('🧪 Testing ORIGINAL AutoBlog system with HTTP API fix...');
    
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    // Prepare form data
    const form = new FormData();
    form.append('images', testImageBuffer, 'test-image.png');
    form.append('userPrompt', 'Test your REAL TOGNINJA BLOG WRITER Assistant with the beautiful original interface!');
    form.append('language', 'de');
    form.append('publishOption', 'draft');
    form.append('siteUrl', 'https://www.newagefotografie.com');
    
    console.log('📤 Sending test request to /api/autoblog/generate...');
    
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer test-token',
        ...form.getHeaders()
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ ORIGINAL AutoBlog test SUCCESS!');
      console.log('📝 Generated post ID:', result.post?.id);
      console.log('🧠 Has AI content:', !!result.ai);
      console.log('🔑 AI content keys:', result.ai ? Object.keys(result.ai) : 'none');
      console.log('📄 Content HTML length:', result.ai?.content_html?.length || 0);
      console.log('📝 Title:', result.ai?.title || 'none');
      console.log('🏷️ SEO Title:', result.ai?.seo_title || 'none');
      
      if (result.ai?.content_html) {
        console.log('📄 Content HTML preview:', result.ai.content_html.substring(0, 300) + '...');
      }
      
      console.log('\n🎉 ORIGINAL AutoBlog system is working with HTTP API fix!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Original AutoBlog test FAILED');
      console.error('Status:', response.status);
      console.error('Error:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// Run the test
testOriginalAutoBlog().then(success => {
  if (success) {
    console.log('\n🎊 SUCCESS: Your beautiful original AutoBlog interface now works with the REAL Assistant!');
  } else {
    console.log('\n💔 FAILED: The original system still needs work');
  }
});