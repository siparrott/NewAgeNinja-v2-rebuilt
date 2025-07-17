// Test AutoBlog with real image
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testRealImageAutoBlog() {
  try {
    console.log('=== Testing AutoBlog with Real Image ===');
    
    // Use a real image from the attached assets
    const imagePath = path.join(process.cwd(), 'attached_assets', 'image_1752756571884.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('Image not found, creating synthetic JPG...');
      
      // Create a more realistic test image buffer (simple colored square)
      const imageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14,
        0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02,
        0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0, 0x07, 0xFF, 0xD9
      ]);
      
      const formData = new FormData();
      formData.append('images', imageBuffer, {
        filename: 'family-portrait-session.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('userPrompt', 'Warm family portrait session in Vienna with parents and two children, natural lighting, autumn setting in Schönbrunn Palace gardens');
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
        console.log('SEO Title:', result.post.seoTitle);
        console.log('Slug:', result.post.slug);
        console.log('Content HTML length:', result.post.contentHtml?.length || 0);
        console.log('Content preview:', result.post.contentHtml?.substring(0, 800) + '...');
        console.log('Meta Description:', result.post.metaDescription);
        console.log('Tags:', result.post.tags);
        console.log('Status:', result.post.status);
        
        // Check if content contains structured sections
        const hasH1 = result.post.contentHtml?.includes('<h1>');
        const hasH2 = result.post.contentHtml?.includes('<h2>');
        const hasImages = result.post.contentHtml?.includes('<img src=');
        
        console.log('Contains H1:', hasH1);
        console.log('Contains H2:', hasH2);
        console.log('Contains embedded images:', hasImages);
        
        // Check if Assistant API was used successfully
        if (result.post.contentHtml && result.post.contentHtml.length > 500) {
          console.log('✅ Complete success: Generated substantial content!');
        } else {
          console.log('⚠️ Partial success: Generated minimal content');
        }
        
        // Check for structured format compliance
        console.log('\n=== Checking for structured format compliance ===');
        console.log('Has structured content sections:', hasH1 && hasH2);
        console.log('Content includes real analysis:', !result.post.contentHtml?.includes("I'm sorry, I can't analyze"));
        
      } else {
        console.log('❌ Failed:', result.error);
      }
      
    } else {
      console.log('Found existing image, using real file...');
      // Use the real image file logic here
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealImageAutoBlog();