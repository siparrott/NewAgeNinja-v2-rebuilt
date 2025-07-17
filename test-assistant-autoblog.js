// Test AutoBlog with OpenAI Assistant integration
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testAssistantAutoBlog() {
  try {
    console.log('Testing AutoBlog with OpenAI Assistant integration...');
    
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'family-portrait.png',
      contentType: 'image/png'
    });
    formData.append('userPrompt', 'Beautiful family portrait session showcasing authentic moments');
    formData.append('language', 'de');
    formData.append('publishNow', 'false');
    formData.append('siteUrl', 'https://www.newagefotografie.com');

    console.log('Making request to AutoBlog with Assistant...');
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ AutoBlog with Assistant successful!');
      console.log('Post ID:', result.post.id);
      console.log('Title:', result.post.title);
      console.log('Slug:', result.post.slug);
      console.log('Content length:', result.post.contentHtml?.length || 0);
      console.log('Tags:', result.post.tags);
      
      // Test the blog post URL
      console.log('\nTesting blog post access...');
      const blogResponse = await fetch(`http://localhost:5000/api/blog/posts/${result.post.slug}`);
      console.log('Blog access status:', blogResponse.status);
      
      if (blogResponse.ok) {
        const blogData = await blogResponse.json();
        console.log('✅ Blog post accessible via API');
        console.log('Final content length:', blogData.contentHtml?.length || 0);
        console.log('Published:', blogData.published);
      }
    } else {
      console.log('❌ AutoBlog failed:', result.error);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAssistantAutoBlog();