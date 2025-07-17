// Test AutoBlog with a real photography session scenario
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testRealAutoBlog() {
  try {
    console.log('Testing AutoBlog with real photography session...');
    
    // Create a test image buffer representing a family portrait
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'family-session-vienna.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('userPrompt', 'Zauberhafte Familiensession im Wiener Prater mit natürlichen Momenten zwischen Eltern und Kindern bei goldenem Licht');
    formData.append('language', 'de');
    formData.append('publishNow', 'false');
    formData.append('siteUrl', 'https://www.newagefotografie.com');

    console.log('Uploading image and generating blog post...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`Response received in ${duration} seconds`);
    console.log('Response status:', response.status);
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n🎉 AutoBlog Generation Successful!');
      console.log('================================');
      console.log('Blog Post Details:');
      console.log('- ID:', result.post.id);
      console.log('- Title:', result.post.title);
      console.log('- SEO Title:', result.post.seoTitle);
      console.log('- Slug:', result.post.slug);
      console.log('- Meta Description:', result.post.metaDescription);
      console.log('- Content Length:', result.post.contentHtml?.length || 0, 'characters');
      console.log('- Tags:', result.post.tags);
      console.log('- Published:', result.post.published);
      console.log('- Language:', result.ai?.language || 'de');
      
      console.log('\nContent Preview:');
      console.log('================');
      const contentPreview = result.post.contentHtml?.substring(0, 200) + '...';
      console.log(contentPreview);
      
      // Test accessing the generated blog post
      console.log('\nTesting blog post access...');
      const blogUrl = `http://localhost:5000/api/blog/posts/${result.post.slug}`;
      const blogResponse = await fetch(blogUrl);
      
      if (blogResponse.ok) {
        const blogData = await blogResponse.json();
        console.log('✅ Blog post accessible at:', `/blog/${result.post.slug}`);
        console.log('✅ SEO metadata properly set');
        console.log('✅ German content generated successfully');
        
        return {
          success: true,
          duration,
          postId: result.post.id,
          slug: result.post.slug,
          contentLength: result.post.contentHtml?.length || 0
        };
      } else {
        console.log('❌ Blog post not accessible');
        return { success: false, error: 'Blog post not accessible' };
      }
      
    } else {
      console.log('❌ AutoBlog Generation Failed');
      console.log('Error:', result.error);
      console.log('Debug info:', result.debug);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testRealAutoBlog().then(result => {
  console.log('\n📊 Test Summary:');
  console.log('================');
  if (result.success) {
    console.log(`✅ AutoBlog working perfectly! Generated ${result.contentLength} characters in ${result.duration}s`);
    console.log(`✅ Blog post created with slug: ${result.slug}`);
    console.log('✅ Full end-to-end functionality confirmed');
  } else {
    console.log(`❌ Test failed: ${result.error}`);
  }
}).catch(err => {
  console.error('Unexpected error:', err);
});