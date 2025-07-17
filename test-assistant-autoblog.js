// Test AutoBlog with Assistant API and structured output
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testAssistantAutoBlog() {
  try {
    console.log('=== Testing AutoBlog with Assistant API Integration ===');
    
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'test-family-session.png',
      contentType: 'image/png'
    });
    formData.append('userPrompt', 'Professional family portrait session in Vienna park with autumn colors, children playing, natural moments');
    formData.append('language', 'de');
    formData.append('publishOption', 'publish');
    formData.append('siteUrl', 'https://www.newagefotografie.com');

    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ Blog post created successfully!');
      console.log('Post ID:', result.post.id);
      console.log('Title:', result.post.title);
      console.log('SEO Title:', result.post.seoTitle);
      console.log('Slug:', result.post.slug);
      console.log('Content HTML length:', result.post.contentHtml?.length || 0);
      console.log('Content preview:', result.post.contentHtml?.substring(0, 400) + '...');
      console.log('Meta Description:', result.post.metaDescription);
      console.log('Tags:', result.post.tags);
      console.log('Status:', result.post.status);
      
      // Check if content contains structured sections
      const hasStructuredContent = result.post.contentHtml?.includes('<h1>') && result.post.contentHtml?.includes('<h2>');
      console.log('Contains structured HTML:', hasStructuredContent);
      
      // Check if content contains actual image tags
      const hasImageTags = result.post.contentHtml?.includes('<img src=');
      console.log('Contains embedded images:', hasImageTags);
      
      if (hasStructuredContent && hasImageTags) {
        console.log('✅ Complete success: Structured content with embedded images!');
      } else {
        console.log('⚠️ Partial success: Missing structured content or images');
      }
      
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAssistantAutoBlog();