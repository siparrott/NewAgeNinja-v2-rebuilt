// Test AutoBlog with real image from attached assets
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testRealAutoBlog() {
  try {
    console.log('=== Testing AutoBlog with Real Image ===');
    
    // Use one of the real images from attached assets
    const imagePath = path.join(process.cwd(), 'attached_assets', 'image_1752756571884.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image not found at:', imagePath);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('Image buffer size:', imageBuffer.length);
    
    const formData = new FormData();
    formData.append('images', imageBuffer, {
      filename: 'family-session-vienna.png',
      contentType: 'image/png'
    });
    formData.append('userPrompt', 'Herzliche Familienfotos im Wiener Schönbrunn Park mit Eltern und zwei Kindern bei Sonnenuntergang');
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
      console.log('Slug:', result.post.slug);
      console.log('Content HTML length:', result.post.contentHtml?.length || 0);
      
      // Test if images are embedded
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
          console.log('First image URL:', firstImageUrl);
          
          try {
            const imageResponse = await fetch(`http://localhost:5000${firstImageUrl}`);
            console.log('Image response status:', imageResponse.status);
            console.log('Image content type:', imageResponse.headers.get('content-type'));
            
            if (imageResponse.ok) {
              const buffer = await imageResponse.buffer();
              console.log('Image size:', buffer.length, 'bytes');
              console.log('✅ Image is accessible');
            } else {
              console.log('❌ Image is not accessible');
            }
          } catch (imageError) {
            console.log('❌ Error testing image:', imageError.message);
          }
        }
      }
      
      // Test blog post page
      console.log('\n=== Testing Blog Post Page ===');
      try {
        const blogPageResponse = await fetch(`http://localhost:5000/blog/${result.post.slug}`);
        console.log('Blog page response status:', blogPageResponse.status);
        
        if (blogPageResponse.ok) {
          const blogPageHtml = await blogPageResponse.text();
          const hasImagesInPage = blogPageHtml.includes('/blog-images/');
          console.log('Blog page contains image references:', hasImagesInPage);
          
          if (hasImagesInPage) {
            console.log('✅ Blog page displays images correctly');
          } else {
            console.log('⚠️ Blog page may not display images correctly');
          }
        }
      } catch (pageError) {
        console.log('❌ Error testing blog page:', pageError.message);
      }
      
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealAutoBlog();