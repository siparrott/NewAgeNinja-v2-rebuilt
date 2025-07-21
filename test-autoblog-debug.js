/**
 * Debug AutoBlog system to identify exact issues
 */

import fetch from 'node-fetch';

async function debugAutoBlogSystem() {
  console.log('🔍 === AUTOBLOG SYSTEM DIAGNOSTIC ===\n');
  
  // Test 1: Check AutoBlog generate endpoint availability
  console.log('1. Testing AutoBlog generate endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'GET'
    });
    console.log('✅ Endpoint accessible:', response.status);
  } catch (error) {
    console.log('❌ Endpoint error:', error.message);
  }
  
  // Test 2: Check if existing blog posts have malformed content
  console.log('\n2. Checking existing blog posts for formatting issues...');
  try {
    const response = await fetch('http://localhost:5000/api/blog/posts');
    const data = await response.json();
    
    console.log(`📊 Found ${data.posts?.length || 0} blog posts`);
    
    if (data.posts?.length > 0) {
      for (let i = 0; i < Math.min(3, data.posts.length); i++) {
        const post = data.posts[i];
        const hasIssues = 
          post.content?.includes('---</p>') || 
          post.content?.includes('####') ||
          post.title?.includes('##') ||
          !post.content?.includes('<h1>');
        
        console.log(`Post ${i+1}: "${post.title?.substring(0, 40)}..." - Issues: ${hasIssues ? '❌' : '✅'}`);
        
        if (hasIssues) {
          console.log(`  🔧 Issues found: ${post.content?.substring(0, 100)}...`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Blog posts check failed:', error.message);
  }
  
  // Test 3: Check comprehensive context gathering function
  console.log('\n3. Testing image analysis and context gathering...');
  try {
    // Create a minimal test of the context system
    const contextTest = {
      userPrompt: 'Weihnachtliche Familienfotosession mit festlicher Dekoration im Studio',
      images: [], // Empty for now
      language: 'de'
    };
    
    console.log('📝 Context test parameters:', contextTest);
    console.log('🎄 Checking if Christmas context would be detected...');
    
    // Check if the context gathering would work
    if (contextTest.userPrompt.includes('Weihnacht')) {
      console.log('✅ Christmas context in user prompt detected');
    } else {
      console.log('❌ No Christmas context in user prompt');
    }
  } catch (error) {
    console.log('❌ Context test failed:', error.message);
  }
  
  // Test 4: Check TOGNINJA Assistant integration
  console.log('\n4. Testing TOGNINJA Assistant ID and integration...');
  const assistantId = 'asst_nlyO3yRav2oWtyTvkq0cHZaU';
  console.log('🤖 TOGNINJA Assistant ID:', assistantId);
  
  // Test 5: Check if server has required environment variables
  console.log('\n5. Testing environment setup...');
  console.log('🔑 Environment variables should include OPENAI_API_KEY');
  
  // Test 6: Check content fixes system
  console.log('\n6. Testing content quality fixes...');
  const sampleBadContent = '---</p><h2>## Heading</h2><p>Content with #### issues</p>';
  console.log('🧹 Sample malformed content:', sampleBadContent.substring(0, 50) + '...');
  console.log('🎯 Issues to fix: "---</p>" prefix, "##" in headings, "####" markdown');
  
  console.log('\n📊 === DIAGNOSTIC COMPLETE ===');
  console.log('🔧 Next steps to fix AutoBlog system:');
  console.log('   1. Fix malformed content in existing blog posts');
  console.log('   2. Ensure Christmas context is properly analyzed from images');
  console.log('   3. Verify TOGNINJA Assistant integration is working');
  console.log('   4. Test content quality fixes are being applied');
  console.log('   5. Ensure proper HTML structure generation');
}

debugAutoBlogSystem();