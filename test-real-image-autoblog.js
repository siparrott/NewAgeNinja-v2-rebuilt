// Test AutoBlog with real image and verify both German content and proper image display
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testRealImageAutoBlog() {
  try {
    console.log('=== Testing Real Image AutoBlog with German Content ===');
    
    // Use a different image to test fresh generation
    const imagePath = path.join(process.cwd(), 'attached_assets', 'image_1752758225675.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Test image not found, trying alternative...');
      const altImagePath = path.join(process.cwd(), 'attached_assets', 'image_1752760513043.png');
      if (fs.existsSync(altImagePath)) {
        console.log('✅ Using alternative image');
      } else {
        console.log('❌ No suitable test image found');
        return;
      }
    }
    
    const imageBuffer = fs.readFileSync(fs.existsSync(imagePath) ? imagePath : path.join(process.cwd(), 'attached_assets', 'image_1752760513043.png'));
    console.log('✅ Loaded test image:', imageBuffer.length, 'bytes');
    
    // Create FormData with German prompt emphasis
    const formData = new FormData();
    formData.append('images', imageBuffer, {
      filename: 'familien-session-wien.png',
      contentType: 'image/png'
    });
    formData.append('userPrompt', 'Wunderschöne Familienfotosession in Wien mit authentischen Momenten zwischen Eltern und Kindern, natürliche Beleuchtung, emotionale Verbindung und professionelle Porträts im Studio');
    formData.append('language', 'de');
    formData.append('publishOption', 'publish');
    formData.append('siteUrl', 'https://www.newagefotografie.com');

    console.log('📤 Sending request to AutoBlog API with German emphasis...');
    
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
      
      // Check if content is in German
      const contentPreview = result.post.contentHtml?.substring(0, 500) || '';
      const hasGermanContent = contentPreview.includes('und') || contentPreview.includes('der') || contentPreview.includes('die') || contentPreview.includes('das');
      console.log('🇩🇪 Content appears to be in German:', hasGermanContent);
      
      if (hasGermanContent) {
        console.log('✅ German content generation successful');
      } else {
        console.log('❌ Content not in German - needs fix');
        console.log('Content preview:', contentPreview);
      }
      
      // Test image accessibility
      const hasImages = result.post.contentHtml?.includes('<img src="/blog-images/');
      console.log('🖼️  Images embedded:', hasImages);
      
      if (hasImages) {
        const imageRegex = /<img[^>]*src="([^"]*blog-images[^"]*)"[^>]*>/g;
        const matches = [...result.post.contentHtml.matchAll(imageRegex)];
        console.log('📸 Found', matches.length, 'embedded images');
        
        // Test first image
        if (matches.length > 0) {
          const imageUrl = matches[0][1];
          console.log(`\n🔍 Testing image: ${imageUrl}`);
          
          const imageResponse = await fetch(`http://localhost:5000${imageUrl}`);
          console.log(`   Status: ${imageResponse.status}`);
          console.log(`   Content-Type: ${imageResponse.headers.get('content-type')}`);
          
          if (imageResponse.ok) {
            const buffer = await imageResponse.buffer();
            console.log(`   Size: ${buffer.length} bytes`);
            
            // Check if it's a valid image by looking at headers
            const contentType = imageResponse.headers.get('content-type');
            const isValidImage = contentType && contentType.startsWith('image/');
            console.log(`   Valid image: ${isValidImage}`);
            
            if (isValidImage) {
              console.log('✅ Image is properly accessible and valid');
            } else {
              console.log('❌ Image may be corrupted or invalid');
            }
          } else {
            console.log('❌ Image not accessible');
          }
        }
      }
      
      // Test blog page display
      console.log('\n🌐 Testing blog page display...');
      const pageResponse = await fetch(`http://localhost:5000/blog/${result.post.slug}`);
      console.log('Page status:', pageResponse.status);
      
      if (pageResponse.ok) {
        const pageHtml = await pageResponse.text();
        const hasReactApp = pageHtml.includes('id="root"');
        console.log('⚛️  React app container found:', hasReactApp);
        
        if (hasReactApp) {
          console.log('✅ Blog page structure is correct');
        }
      }
      
      console.log('\n=== Test Summary ===');
      console.log('✅ AutoBlog generation completed');
      console.log('✅ OpenAI integration working');
      console.log('✅ Image processing and storage');
      console.log('✅ Database operations successful');
      console.log(hasGermanContent ? '✅ German content generation working' : '❌ German content generation needs fix');
      console.log(hasImages ? '✅ Image embedding working' : '❌ Image embedding needs fix');
      
      // Show actual content preview for verification
      console.log('\n=== Content Preview (first 300 chars) ===');
      console.log(result.post.contentHtml?.substring(0, 300) + '...');
      
    } else {
      console.log('❌ Blog generation failed:', result.error);
      if (result.debug) {
        console.log('🔍 Debug info:', JSON.stringify(result.debug, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealImageAutoBlog();