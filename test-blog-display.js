// Test blog post display and image accessibility
import fetch from 'node-fetch';

async function testBlogDisplay() {
  try {
    console.log('=== Testing Blog Post Display ===');
    
    // Test API endpoint
    const response = await fetch('http://localhost:5000/api/blog/posts/neugeborenenfotografie-wien-momente');
    const post = await response.json();
    
    console.log('Post title:', post.title);
    console.log('Post slug:', post.slug);
    console.log('Content HTML length:', post.contentHtml?.length || 0);
    
    // Extract image tags
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(post.contentHtml)) !== null) {
      images.push(match[1]);
    }
    
    console.log('Found images:', images.length);
    
    // Test each image accessibility
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      console.log(`\nTesting image ${i + 1}: ${imageUrl}`);
      
      try {
        const imageResponse = await fetch(`http://localhost:5000${imageUrl}`);
        console.log(`  Status: ${imageResponse.status}`);
        console.log(`  Content-Type: ${imageResponse.headers.get('content-type')}`);
        
        if (imageResponse.ok) {
          const buffer = await imageResponse.buffer();
          console.log(`  Size: ${buffer.length} bytes`);
          console.log(`  ✅ Image accessible`);
        } else {
          console.log(`  ❌ Image not accessible`);
        }
      } catch (error) {
        console.log(`  ❌ Error accessing image: ${error.message}`);
      }
    }
    
    // Test content structure
    console.log('\n=== Content Structure Analysis ===');
    const hasProperImages = post.contentHtml.includes('<img src="/blog-images/') && !post.contentHtml.includes('src=""');
    const hasHeaders = post.contentHtml.includes('<h1>') || post.contentHtml.includes('<h2>');
    const hasParagraphs = post.contentHtml.includes('<p>');
    
    console.log('Has proper image tags:', hasProperImages);
    console.log('Has headers:', hasHeaders);
    console.log('Has paragraphs:', hasParagraphs);
    
    if (hasProperImages && hasHeaders && hasParagraphs) {
      console.log('✅ Blog post structure looks good!');
    } else {
      console.log('⚠️  Blog post structure needs improvement');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBlogDisplay();