/**
 * Complete AutoBlog test with Christmas context and TOGNINJA Assistant
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

async function testCompleteAutoBlog() {
  try {
    console.log('🧪 TESTING: Complete AutoBlog with Christmas context...');

    // Create test form data with Christmas context
    const formData = new FormData();
    
    // Test with the existing image (should be Christmas family photos)
    console.log('📸 Using existing uploaded images for Christmas family session...');
    
    // Create a mock image buffer for testing
    const testImageBuffer = Buffer.from('test image data');
    formData.append('images', testImageBuffer, {
      filename: 'christmas-family-1.jpg',
      contentType: 'image/jpeg'
    });

    // Christmas-specific content guidance
    formData.append('contentGuidance', 'Weihnachtliche Familienfotosession im Studio - festliche Stimmung, Weihnachtskleidung, warme Familienmomente zur Weihnachtszeit');
    formData.append('language', 'de');
    formData.append('publishOption', 'draft');
    formData.append('siteUrl', 'https://www.newagefotografie.com');

    console.log('🎄 Sending request with Christmas context...');

    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers.raw());

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS: AutoBlog generation complete!');
      console.log('📝 Generated blog post:', {
        id: result.post?.id,
        title: result.post?.title,
        content_length: result.post?.content?.length,
        has_christmas: result.post?.content?.includes('Weihnacht') || result.post?.title?.includes('Weihnacht'),
        method: result.debug?.method || 'unknown'
      });

      // Check if Christmas context was properly used
      if (result.post?.content?.includes('Weihnacht') || result.post?.title?.includes('Weihnacht')) {
        console.log('🎄 CHRISTMAS CONTEXT SUCCESS: Blog mentions Christmas content!');
        console.log('🎯 Context gathering working properly');
      } else {
        console.log('❌ CHRISTMAS CONTEXT FAILED: No Christmas mention in generated content');
        console.log('📝 Title:', result.post?.title);
        console.log('📝 Content preview:', result.post?.content?.substring(0, 200));
      }

      // Check if TOGNINJA Assistant was used
      if (result.debug?.method === 'openai-assistant-api') {
        console.log('✅ TOGNINJA ASSISTANT SUCCESS: Real Assistant API used');
      } else {
        console.log('⚠️ FALLBACK USED: Not using real TOGNINJA Assistant');
        console.log('🔧 Method used:', result.debug?.method);
      }

      // Check content structure
      const content = result.post?.content || '';
      const hasProperStructure = content.includes('<h1>') && content.includes('<h2>') && content.includes('<p>');
      
      if (hasProperStructure && !content.includes('---</p>')) {
        console.log('✅ CONTENT STRUCTURE SUCCESS: Proper HTML formatting');
      } else {
        console.log('❌ CONTENT STRUCTURE FAILED: Malformed HTML detected');
        console.log('🔧 Content preview:', content.substring(0, 100));
      }

      return result.post;
    } else {
      const errorText = await response.text();
      console.error('❌ AutoBlog generation failed:', response.status, errorText);
      return null;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

// Test the context gathering independently
async function testContextGathering() {
  console.log('\n🔍 TESTING: Context gathering system...');
  
  try {
    const response = await fetch('http://localhost:5000/api/autoblog/debug-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userPrompt: 'Weihnachtliche Familienfotosession mit festlicher Dekoration',
        imageCount: 3
      })
    });

    if (response.ok) {
      const contextData = await response.json();
      console.log('✅ Context gathering working');
      console.log('📊 Context sources:', {
        website_context: !!contextData.websiteContext,
        seo_context: !!contextData.seoContext,
        knowledge_base: !!contextData.knowledgeBaseContext,
        image_analysis: !!contextData.imageAnalysis
      });
      
      if (contextData.imageAnalysis?.includes('christmas') || contextData.imageAnalysis?.includes('festive')) {
        console.log('🎄 Image analysis detected Christmas context');
      }
    } else {
      console.log('⚠️ Context gathering endpoint not available');
    }
  } catch (error) {
    console.log('⚠️ Context gathering test skipped:', error.message);
  }
}

// Run tests
async function runCompleteTest() {
  console.log('🚀 === COMPLETE AUTOBLOG SYSTEM TEST ===\n');
  
  // Test 1: Context gathering
  await testContextGathering();
  
  // Test 2: Full AutoBlog generation
  const result = await testCompleteAutoBlog();
  
  console.log('\n📊 === TEST RESULTS SUMMARY ===');
  if (result) {
    console.log('✅ AutoBlog system operational');
    console.log('🔗 View result at: http://localhost:5000/blog/' + result.slug);
  } else {
    console.log('❌ AutoBlog system needs fixes');
  }
}

runCompleteTest();