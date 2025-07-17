// Test real AutoBlog generation with image embedding
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testRealAutoBlog() {
  try {
    console.log('=== Testing Real AutoBlog with Image Embedding ===');
    
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
      console.log('Content HTML length:', result.post.contentHtml?.length || 0);
      console.log('Content preview:', result.post.contentHtml?.substring(0, 300) + '...');
      console.log('Image URL:', result.post.imageUrl);
      
      // Check if content contains actual image tags
      const hasImageTags = result.post.contentHtml?.includes('<img src=');
      console.log('Contains embedded images:', hasImageTags);
      
      if (hasImageTags) {
        console.log('✅ Images successfully embedded in content!');
      } else {
        console.log('❌ No images found in content');
      }
      
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealAutoBlog();