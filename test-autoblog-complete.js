#!/usr/bin/env node

/**
 * Complete AutoBlog System Test
 * Tests all content quality fixes and image processing
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testAutoBlogSystem() {
  console.log('🧪 Testing AutoBlog System with Content Quality Fixes...\n');
  
  try {
    // Step 1: Create test image data (simulate uploaded files)
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    // Step 2: Create form data with images
    const form = new FormData();
    form.append('contentGuidance', 'Professional maternity photoshoot showcasing beautiful pregnant woman in elegant white dress, studio lighting, emotional connection');
    form.append('language', 'de');
    form.append('publishOption', 'draft');
    form.append('websiteUrl', 'https://www.newagefotografie.com');
    form.append('images', testImageData, {
      filename: 'maternity-test-1.jpg',
      contentType: 'image/jpeg'
    });
    form.append('images', testImageData, {
      filename: 'maternity-test-2.jpg', 
      contentType: 'image/jpeg'
    });
    
    console.log('📤 Sending test request to AutoBlog API...');
    
    // Step 3: Make API request
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    console.log('\n🔍 Test Results:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('\n✅ AUTOBLOG SYSTEM WORKING PROPERLY!');
      console.log('Generated Post ID:', result.post.id);
      console.log('Title:', result.post.title);
      console.log('Content Length:', result.post.content?.length || 0, 'characters');
      
      // Check for quality improvements
      const content = result.post.content || '';
      
      console.log('\n🔧 Content Quality Check:');
      console.log('✅ No H1/H2 prefixes:', !content.includes('H1:') && !content.includes('H2:'));
      console.log('✅ Clean HTML structure:', content.includes('<h2>') || content.includes('<h3>'));
      console.log('✅ Image integration:', content.includes('<img'));
      console.log('✅ German content:', content.includes('Fotografie') || content.includes('Wien'));
      console.log('✅ Proper formatting:', !content.includes('###'));
      
      // Show content preview
      console.log('\n📝 Content Preview:');
      console.log(content.substring(0, 400) + '...\n');
      
    } else {
      console.log('\n❌ Test failed:', result.error);
      
      if (result.error.includes('image')) {
        console.log('\n💡 Note: Image upload may need multipart/form-data handling');
        return testWithoutImages();
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    
    if (error.message.includes('image')) {
      console.log('\n🔄 Retrying without image upload...');
      return testWithoutImages();
    }
  }
}

async function testWithoutImages() {
  console.log('\n🧪 Testing AutoBlog System (Text-only mode)...');
  
  try {
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentGuidance: 'Beautiful maternity photography session in Vienna studio with pregnant woman in white dress, professional lighting, emotional moments',
        language: 'de',
        publishOption: 'draft', 
        websiteUrl: 'https://www.newagefotografie.com'
      })
    });
    
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Text-only test failed:', error.message);
  }
}

// Run test
testAutoBlogSystem().then(() => {
  console.log('\n🏁 AutoBlog system test completed!');
}).catch(console.error);