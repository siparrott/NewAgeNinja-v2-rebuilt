// Test simplified AutoBlog prompt
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testSimplified() {
  try {
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'studio-session.png',
      contentType: 'image/png'
    });
    formData.append('userPrompt', 'Professional studio portrait session documentation');
    formData.append('language', 'de');
    formData.append('publishNow', 'false');
    formData.append('siteUrl', 'https://www.newagefotografie.com');

    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Result:', result.success ? '✅ Success' : '❌ Failed');
    if (!result.success) {
      console.log('Error:', result.error);
    } else {
      console.log('Generated post:', result.post.title);
      console.log('Content length:', result.post.contentHtml?.length || 0);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testSimplified();