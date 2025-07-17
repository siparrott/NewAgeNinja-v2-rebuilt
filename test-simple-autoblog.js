// Test AutoBlog with minimal, safe business content
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testSimpleAutoBlog() {
  try {
    console.log('Testing AutoBlog with safe business content...');
    
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'business-portrait.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('userPrompt', 'Professional business portrait photography session in Vienna studio');
    formData.append('language', 'de');
    formData.append('publishNow', 'false');
    formData.append('siteUrl', 'https://www.newagefotografie.com');

    console.log('Testing with safe business prompt...');
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Success! AutoBlog works with safe business content');
      console.log('Title:', result.post.title);
      console.log('Content length:', result.post.contentHtml?.length || 0);
      return true;
    } else {
      console.log('❌ Still failing with safe content');
      console.log('Error:', result.error);
      return false;
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

testSimpleAutoBlog();