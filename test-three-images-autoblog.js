// Test AutoBlog with exactly 3 images to verify proper distribution
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testThreeImagesAutoBlog() {
  try {
    console.log('=== Testing AutoBlog with 3 Images ===');
    
    // Create three different test images
    const images = [
      {
        name: 'family-portrait-1.jpg',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48])
      },
      {
        name: 'family-portrait-2.jpg', 
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x16, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x49, 0x49, 0x2A, 0x00])
      },
      {
        name: 'family-portrait-3.jpg',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE2, 0x00, 0x1C, 0x49, 0x43, 0x43, 0x5F, 0x50, 0x52, 0x4F, 0x46, 0x49, 0x4C])
      }
    ];
    
    console.log('📤 Creating form data with 3 images...');
    const formData = new FormData();
    
    // Add all three images
    images.forEach((img, index) => {
      formData.append('images', img.buffer, {
        filename: img.name,
        contentType: 'image/jpeg'
      });
      console.log(`   ✅ Added image ${index + 1}: ${img.name} (${img.buffer.length} bytes)`);
    });
    
    formData.append('userPrompt', 'Wunderschöne Familienfotosession im Wiener Schönbrunn Park mit Eltern und zwei Kindern bei goldenem Abendlicht');
    formData.append('language', 'de');
    formData.append('publishOption', 'publish');
    formData.append('siteUrl', 'https://www.newagefotografie.com');
    
    console.log('📤 Sending request to AutoBlog API...');
    
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Generation success:', result.success);
    
    if (result.success) {
      console.log('✅ Blog post generated successfully!');
      console.log('📄 Title:', result.post.title);
      console.log('🔗 Slug:', result.post.slug);
      console.log('📝 Content length:', result.post.contentHtml?.length || 0);
      console.log('🖼️  Cover image:', result.post.imageUrl);
      console.log('📊 Status:', result.post.status);
      
      // Verify all images are embedded
      const contentHtml = result.post.contentHtml || '';
      const imageRegex = /<img[^>]*src="[^"]*blog-images[^"]*"[^>]*>/g;
      const imageMatches = [...contentHtml.matchAll(imageRegex)];
      
      console.log(`\n🖼️  Images embedded: ${imageMatches.length > 0}`);
      console.log(`📸 Found ${imageMatches.length} embedded images`);
      
      if (imageMatches.length === 3) {
        console.log('✅ SUCCESS: All 3 images properly distributed!');
        
        // Test each image accessibility
        for (let i = 0; i < imageMatches.length; i++) {
          const imgTag = imageMatches[i][0];
          const srcMatch = imgTag.match(/src="([^"]+)"/);
          
          if (srcMatch) {
            const imageUrl = srcMatch[1];
            console.log(`\n🔍 Testing image ${i + 1}: ${imageUrl}`);
            
            try {
              const imageResponse = await fetch(`http://localhost:5000${imageUrl}`);
              console.log(`   Status: ${imageResponse.status}`);
              console.log(`   Content-Type: ${imageResponse.headers.get('content-type')}`);
              
              if (imageResponse.ok) {
                console.log(`   ✅ Image ${i + 1} accessible`);
              } else {
                console.log(`   ❌ Image ${i + 1} not accessible`);
              }
            } catch (error) {
              console.log(`   ❌ Error testing image ${i + 1}:`, error.message);
            }
          }
        }
      } else if (imageMatches.length === 1) {
        console.log('⚠️  WARNING: Only 1 image embedded - duplication bug still exists');
      } else if (imageMatches.length === 0) {
        console.log('❌ ERROR: No images embedded');
      } else {
        console.log(`⚠️  PARTIAL: ${imageMatches.length}/3 images embedded`);
      }
      
      // Show H2 structure for verification
      const h2Regex = /<h2[^>]*>(.*?)<\/h2>/g;
      const h2Matches = [...contentHtml.matchAll(h2Regex)];
      console.log(`\n📋 Blog structure: ${h2Matches.length} H2 sections found`);
      h2Matches.forEach((h2, index) => {
        console.log(`   ${index + 1}. ${h2[1]}`);
      });
      
    } else {
      console.log('❌ Blog post generation failed');
      console.log('Error:', result.error);
    }
    
    console.log('\n=== Test Results Summary ===');
    if (result.success) {
      const imageCount = [...(result.post.contentHtml || '').matchAll(/<img[^>]*src="[^"]*blog-images[^"]*"[^>]*>/g)].length;
      console.log(`✅ Generated blog post with ${imageCount}/3 images distributed`);
      console.log(`✅ Image distribution algorithm ${imageCount === 3 ? 'working perfectly' : 'needs adjustment'}`);
    } else {
      console.log('❌ Test failed - blog post generation error');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testThreeImagesAutoBlog();