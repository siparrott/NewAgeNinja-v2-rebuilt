#!/usr/bin/env node

/**
 * CREATE TWO COMPLETE BLOGS - Testing Featured Image System
 */

import fs from 'fs';
import FormData from 'form-data';

async function createTwoCompleteBlogs() {
  console.log('🎯 CREATING TWO COMPLETE BLOGS WITH FEATURED IMAGES');
  
  const blogs = [
    {
      name: 'Garden Tools Blog',
      imagePath: 'attached_assets/Best-Gardening-Tools-Names-with-Pictures-and-Their-Uses_1753175928150.webp',
      guidance: 'Write a comprehensive German blog about these gardening tools, their uses, and tips for Wien gardeners. Include pricing and studio information.',
      slug: 'garten-werkzeuge-wien-fotografie-' + Date.now()
    },
    {
      name: 'Golf Equipment Blog', 
      imagePath: 'attached_assets/image_1753175151537.png',
      guidance: 'Create a German blog about golf equipment photography and sports photography services in Wien. Include business details and pricing.',
      slug: 'golf-ausruestung-sportfotografie-wien-' + Date.now()
    }
  ];
  
  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    console.log(`\n📝 CREATING BLOG ${i + 1}: ${blog.name}`);
    
    try {
      if (!fs.existsSync(blog.imagePath)) {
        console.log(`❌ Image not found: ${blog.imagePath}`);
        continue;
      }
      
      console.log(`📁 Using image: ${blog.imagePath}`);
      
      const formData = new FormData();
      formData.append('images', fs.createReadStream(blog.imagePath));
      formData.append('contentGuidance', blog.guidance);
      formData.append('publishOption', 'publish');
      formData.append('customSlug', blog.slug);
      
      console.log('🚀 Generating blog...');
      
      const generateResponse = await fetch('http://localhost:5000/api/autoblog/generate', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        timeout: 180000 // 3 minute timeout
      });
      
      if (generateResponse.ok) {
        const result = await generateResponse.json();
        
        console.log('✅ BLOG CREATED SUCCESSFULLY:');
        console.log(`   - Title: ${result.post?.title || 'none'}`);
        console.log(`   - Slug: ${result.post?.slug || 'none'}`);
        console.log(`   - Status: ${result.post?.status || 'none'}`);
        console.log(`   - Featured image: ${result.post?.imageUrl ? 'SET' : 'MISSING'}`);
        
        if (result.post?.imageUrl) {
          console.log(`   - Featured URL: ${result.post.imageUrl}`);
          
          // Test featured image accessibility
          try {
            const featuredResponse = await fetch(result.post.imageUrl);
            console.log(`   - Featured accessible: ${featuredResponse.ok ? 'YES' : 'NO'} (${featuredResponse.status})`);
          } catch (e) {
            console.log(`   - Featured accessible: ERROR (${e.message})`);
          }
        }
        
        const contentHtml = result.post?.contentHtml || '';
        const imageCount = (contentHtml.match(/<img/g) || []).length;
        console.log(`   - Embedded images: ${imageCount}`);
        
        // Check content adaptation
        const hasGerman = contentHtml.includes('Wien') || contentHtml.includes('Fotografie');
        console.log(`   - German/Wien content: ${hasGerman ? 'YES' : 'NO'}`);
        
        console.log(`   - Blog URL: http://localhost:5000/blog/${result.post?.slug}`);
        
        // Wait 5 seconds between blogs to avoid overwhelming the system
        if (i < blogs.length - 1) {
          console.log('⏳ Waiting 5 seconds before next blog...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } else {
        const errorText = await generateResponse.text();
        console.log(`❌ Generation failed: ${generateResponse.status}`);
        console.log(`   Error: ${errorText.substring(0, 300)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${blog.name}:`, error.message);
    }
  }
  
  // Final verification
  console.log('\n🔍 FINAL VERIFICATION - Checking all recent blogs...');
  
  try {
    const blogsResponse = await fetch('http://localhost:5000/api/blog/posts?limit=5');
    if (blogsResponse.ok) {
      const data = await blogsResponse.json();
      const posts = data.posts || [];
      
      console.log('\n📊 RECENT BLOG POSTS:');
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   - Featured: ${post.imageUrl || post.image_url ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Status: ${post.status}`);
        console.log(`   - URL: /blog/${post.slug}`);
      });
    }
  } catch (e) {
    console.log('❌ Could not fetch blog list:', e.message);
  }
  
  console.log('\n🎉 BLOG CREATION PROCESS COMPLETE!');
  console.log('📋 Check the blog page to see featured images in preview cards');
  console.log('🔗 Visit individual blog posts to see embedded images');
}

createTwoCompleteBlogs();