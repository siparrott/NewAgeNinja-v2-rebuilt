// Test AutoBlog with clean test to verify image generation
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testNoImageAutoBlog() {
  try {
    console.log('=== Testing AutoBlog with Clean Test ===');
    
    // Create a synthetic test image
    const testImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48
    ]);
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'test-family-session.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('userPrompt', 'Herzliche Familienfotos im Wiener Schönbrunn Park mit Eltern und zwei Kindern');
    formData.append('language', 'de');
    formData.append('publishOption', 'draft');
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
      
      // Test if images are being generated
      const hasImages = result.post.contentHtml?.includes('<img src="/blog-images/');
      console.log('Has blog images:', hasImages);
      
      if (hasImages) {
        // Extract image URLs
        const imageRegex = /<img[^>]*src="([^"]*blog-images[^"]*)"[^>]*>/g;
        const matches = [...result.post.contentHtml.matchAll(imageRegex)];
        
        console.log(`Found ${matches.length} image references`);
        
        // Test first image
        if (matches.length > 0) {
          const firstImageUrl = matches[0][1];
          console.log('Testing first image:', firstImageUrl);
          
          try {
            const imageResponse = await fetch(`http://localhost:5000${firstImageUrl}`);
            console.log('Image response status:', imageResponse.status);
            console.log('Image content type:', imageResponse.headers.get('content-type'));
            
            if (imageResponse.ok) {
              console.log('✅ Image is accessible');
            } else {
              console.log('❌ Image is not accessible');
            }
          } catch (imageError) {
            console.log('❌ Error testing image:', imageError.message);
          }
        }
      }
      
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testNoImageAutoBlog();