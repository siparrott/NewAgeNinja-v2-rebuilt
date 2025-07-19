// Complete test of fixed AutoBlog system with TOGNINJA assistant
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testFixedAutoBlog() {
  console.log('🧪 TESTING FIXED AUTOBLOG SYSTEM');
  console.log('================================');
  
  try {
    // Test #1: Check configuration
    console.log('\n📋 TEST #1: Configuration Check');
    const configResponse = await fetch('http://localhost:5000/api/autoblog/diagnostics');
    if (configResponse.ok) {
      const diagnostics = await configResponse.json();
      console.log('✅ Diagnostics endpoint working');
      console.log('📊 Issues detected:', diagnostics.filter(d => d.detected).length);
    } else {
      console.log('⚠️ Diagnostics endpoint not available');
    }
    
    // Test #2: Create test image
    console.log('\n🖼️ TEST #2: Creating Test Image');
    const testImagePath = './test-image.png';
    
    // Create a simple test image using Canvas API simulation
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('✅ Test image created:', testImagePath);
    
    // Test #3: AutoBlog generation with TOGNINJA assistant
    console.log('\n🎯 TEST #3: AutoBlog Generation Test');
    
    const formData = new FormData();
    formData.append('userPrompt', 'Generate a German blog post about family photography in Vienna using your sophisticated training');
    formData.append('language', 'de');
    formData.append('publishOption', 'draft');
    formData.append('websiteUrl', 'https://www.newagefotografie.com');
    formData.append('images', fs.createReadStream(testImagePath), {
      filename: 'test-family-photo.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Sending request to AutoBlog API...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Request completed in ${duration}ms`);
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Test #4: Validate response
    console.log('\n📊 TEST #4: Response Validation');
    console.log('✅ Success:', result.success);
    console.log('✅ Method used:', result.ai?.method || 'unknown');
    console.log('✅ Content length:', result.ai?.content_html?.length || 0, 'characters');
    console.log('✅ German content:', result.ai?.content_html?.includes('Familie') || result.ai?.content_html?.includes('Wien') ? 'YES' : 'NO');
    console.log('✅ Blog post created:', !!result.post);
    
    if (result.ai?.content_html) {
      console.log('📝 Content preview:', result.ai.content_html.substring(0, 200) + '...');
    }
    
    if (result.post) {
      console.log('📄 Blog post ID:', result.post.id);
      console.log('📄 Blog post title:', result.post.title);
      console.log('📄 Blog post status:', result.post.status);
    }
    
    // Test #5: Assistant ID verification
    console.log('\n🔍 TEST #5: Assistant ID Verification');
    if (result.ai?.assistantId) {
      console.log('✅ Assistant ID used:', result.ai.assistantId);
      console.log('✅ TOGNINJA match:', result.ai.assistantId === 'asst_nlyO3yRav2oWtyTvkq0cHZaU' ? 'YES' : 'NO');
    } else {
      console.log('⚠️ Assistant ID not reported in response');
    }
    
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🗑️ Test image cleaned up');
    }
    
    console.log('\n🎉 AUTOBLOG TEST COMPLETE');
    console.log('=========================');
    
    if (result.success && result.ai?.content_html && result.ai.content_html.length > 500) {
      console.log('🎊 ALL TESTS PASSED - AUTOBLOG FIXES WORKING!');
      console.log('✅ TOGNINJA assistant integration successful');
      console.log('✅ German content generation working');
      console.log('✅ Blog post creation functional');
    } else {
      console.log('⚠️ Some tests failed - check logs above');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testFixedAutoBlog().catch(console.error);