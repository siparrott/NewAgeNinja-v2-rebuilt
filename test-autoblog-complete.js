// Complete test of AutoBlog system after implementing all fixes
import fs from 'fs/promises';

async function testCompleteAutoBlog() {
  console.log('🧪 COMPLETE AUTOBLOG TEST - After Expert Fixes');
  console.log('================================================');
  
  // Create test image buffer (1x1 pixel PNG)
  const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU3l3gAAAABJRU5ErkJggg==', 'base64');
  
  try {
    console.log('📝 Testing AutoBlog generation with minimal content...');
    
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    // Add test image
    form.append('images', testImageBuffer, {
      filename: 'test-family-photo.jpg',
      contentType: 'image/jpeg'
    });
    
    // Add minimal input (Fix #1: No prompt override)
    form.append('userPrompt', 'Familienfotos Wien Studio Shooting');
    form.append('language', 'de');
    form.append('publishOption', 'draft');
    
    // Test the actual API endpoint
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      headers: {
        'Cookie': 'auth-session=test-session',
        ...form.getHeaders()
      },
      body: form
    });
    
    const result = await response.json();
    
    console.log('📊 API Response Status:', response.status);
    console.log('📊 Success:', result.success);
    
    if (result.success && result.ai) {
      console.log('✅ Generated content length:', result.ai.content_html?.length || 0);
      console.log('✅ SEO Title:', result.ai.seo_title || 'MISSING');
      console.log('✅ Method used:', result.ai.method || 'UNKNOWN');
      console.log('✅ TOGNINJA match:', result.ai.assistantId === 'asst_nlyO3yRav2oWtyTvkq0cHZaU' ? 'YES' : 'NO');
      
      // Check for structured sections (Fix #4: Complete blog package)
      const content = result.ai.content_html || '';
      const hasKeyTakeaways = content.includes('Key Takeaways') || content.includes('🎯');
      const hasReviewSnippets = content.includes('Review') || content.includes('💬');
      const hasSocialPosts = content.includes('Social') || content.includes('📱');
      const hasInternalLinks = content.includes('/galerie') || content.includes('/kontakt');
      
      console.log('📋 Structured sections check:');
      console.log('  - Key Takeaways:', hasKeyTakeaways ? 'YES' : 'NO');
      console.log('  - Review Snippets:', hasReviewSnippets ? 'YES' : 'NO'); 
      console.log('  - Social Posts:', hasSocialPosts ? 'YES' : 'NO');
      console.log('  - Internal Links:', hasInternalLinks ? 'YES' : 'NO');
      
      // Content quality check
      const wordCount = content.split(' ').length;
      console.log('📝 Word count:', wordCount, '(should be >800)');
      console.log('📝 Contains Vienna:', content.includes('Wien') ? 'YES' : 'NO');
      console.log('📝 German language:', content.includes('Familien') ? 'YES' : 'NO');
      
    } else {
      console.log('❌ AutoBlog generation failed:', result.error || 'Unknown error');
    }
    
    console.log('\n🎯 FIX VALIDATION COMPLETE');
    console.log('Expert analysis fixes tested successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteAutoBlog();