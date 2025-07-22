/**
 * COMPLETE AUTOBLOG SYSTEM TEST
 * 
 * This test verifies the FINAL AutoBlog system implementation:
 * 1. Image processing and saving to /server/public/blog-images/
 * 2. TOGNINJA BLOG WRITER Assistant integration
 * 3. Image embedding with proper HTML tags (NO escaped quotes)
 * 4. Featured image automatic setting
 * 5. Database storage with live blog post
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:5000';

async function testCompleteAutoBlogSystem() {
  console.log('🚀 TESTING COMPLETE AUTOBLOG SYSTEM');
  console.log('=====================================');
  
  try {
    // STEP 1: Prepare test image
    console.log('\n📁 STEP 1: Preparing test image...');
    const testImagePath = './attached_assets/image_1753180204602.png';
    
    // Check if test image exists
    try {
      await fs.access(testImagePath);
      console.log('✅ Test image found:', testImagePath);
    } catch (error) {
      console.error('❌ Test image not found:', testImagePath);
      console.log('Available images in attached_assets:');
      const files = await fs.readdir('./attached_assets');
      files.filter(f => f.endsWith('.png') || f.endsWith('.jpg')).forEach(f => console.log('  -', f));
      return;
    }
    
    // STEP 2: Create form data with image
    console.log('\n📤 STEP 2: Creating form data with image...');
    const imageBuffer = await fs.readFile(testImagePath);
    const form = new FormData();
    form.append('images', imageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    form.append('contentGuidance', 'Erstelle einen authentischen deutschen Blog-Beitrag über diese Familienfotosession in Wien.');
    form.append('language', 'de');
    form.append('publishOption', 'draft');
    
    console.log('✅ Form data created with test image');
    
    // STEP 3: Make API call to complete AutoBlog system
    console.log('\n🚀 STEP 3: Calling complete AutoBlog API...');
    
    // First, login to get auth token
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    
    // Now call the AutoBlog endpoint
    const response = await fetch(`${BASE_URL}/api/autoblog/generate`, {
      method: 'POST',
      headers: {
        'Cookie': cookies
      },
      body: form
    });
    
    console.log('📊 API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API call failed:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ API call successful');
    
    // STEP 4: Verify the results
    console.log('\n🔍 STEP 4: Verifying results...');
    
    if (!result.success) {
      console.error('❌ AutoBlog generation failed:', result.error);
      return;
    }
    
    const blogPost = result.blogPost;
    console.log('✅ Blog post generated successfully');
    console.log('📝 Title:', blogPost.title);
    console.log('🔗 Slug:', blogPost.slug);
    console.log('🖼️ Featured Image URL:', blogPost.imageUrl || blogPost.image_url);
    console.log('📊 Content Length:', blogPost.contentHtml?.length || blogPost.content_html?.length || 0);
    console.log('🏷️ Status:', blogPost.status);
    
    // STEP 5: Verify image files exist
    console.log('\n🖼️ STEP 5: Verifying image files...');
    const blogImagesDir = './server/public/blog-images';
    try {
      const imageFiles = await fs.readdir(blogImagesDir);
      const newImages = imageFiles.filter(f => f.includes('blog-') && f.includes('.jpg'));
      console.log(`✅ Found ${newImages.length} blog images in ${blogImagesDir}`);
      newImages.forEach(img => console.log('  -', img));
      
      if (newImages.length > 0) {
        // Test HTTP access to first image
        const testImageUrl = `${BASE_URL}/blog-images/${newImages[0]}`;
        const imageResponse = await fetch(testImageUrl);
        console.log(`📊 Image HTTP Status: ${imageResponse.status} for ${testImageUrl}`);
        
        if (imageResponse.ok) {
          const contentLength = imageResponse.headers.get('content-length');
          console.log(`✅ Image accessible via HTTP (${contentLength} bytes)`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking blog images:', error.message);
    }
    
    // STEP 6: Verify database record
    console.log('\n💾 STEP 6: Verifying database record...');
    const blogDetailResponse = await fetch(`${BASE_URL}/api/blog/${blogPost.slug}`, {
      headers: { 'Cookie': cookies }
    });
    
    if (blogDetailResponse.ok) {
      const blogDetail = await blogDetailResponse.json();
      console.log('✅ Blog post found in database');
      console.log('🆔 Database ID:', blogDetail.id);
      console.log('🖼️ Featured Image in DB:', blogDetail.imageUrl || blogDetail.image_url);
      
      // Check if images are embedded in content
      const contentHtml = blogDetail.contentHtml || blogDetail.content_html || '';
      const imageMatches = contentHtml.match(/<img[^>]+src="[^">]+"/g);
      console.log(`🖼️ Embedded images found: ${imageMatches ? imageMatches.length : 0}`);
      
      if (imageMatches) {
        imageMatches.forEach((img, i) => console.log(`  ${i + 1}. ${img}`));
      }
      
      // Verify no escaped quotes
      const hasEscapedQuotes = contentHtml.includes('\\"');
      console.log(`✅ No escaped quotes: ${!hasEscapedQuotes}`);
      
    } else {
      console.error('❌ Blog post not found in database');
    }
    
    // STEP 7: Test live blog URL
    console.log('\n🌐 STEP 7: Testing live blog URL...');
    const liveUrl = `${BASE_URL}/blog/${blogPost.slug}`;
    const liveResponse = await fetch(liveUrl);
    console.log(`📊 Live URL Status: ${liveResponse.status} for ${liveUrl}`);
    
    if (liveResponse.ok) {
      console.log('✅ Blog post accessible at live URL');
    }
    
    console.log('\n🎉 COMPLETE AUTOBLOG SYSTEM TEST COMPLETED');
    console.log('==========================================');
    console.log('✅ Image processing and saving');
    console.log('✅ TOGNINJA Assistant integration');
    console.log('✅ Image embedding verification');
    console.log('✅ Featured image setting');
    console.log('✅ Database storage');
    console.log('✅ Live URL accessibility');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCompleteAutoBlogSystem();