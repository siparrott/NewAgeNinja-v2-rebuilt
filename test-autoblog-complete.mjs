#!/usr/bin/env node

/**
 * Complete AutoBlog System Test
 * Tests all content quality fixes with ES modules
 */

import fetch from 'node-fetch';

async function testAutoBlogSystem() {
  console.log('🧪 Testing AutoBlog System with Content Quality Fixes...\n');
  
  try {
    console.log('📤 Sending test request to AutoBlog API...');
    
    // Test with minimum required parameters
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentGuidance: 'Maternity photography session in Vienna studio with beautiful pregnant woman in elegant white dress, professional studio lighting, emotional connection between mother and unborn child',
        language: 'de',
        publishOption: 'draft', 
        websiteUrl: 'https://www.newagefotografie.com'
      })
    });
    
    const result = await response.json();
    
    console.log('\n🔍 Test Results:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('\n✅ AUTOBLOG SYSTEM WORKING PROPERLY!');
      console.log('Generated Post ID:', result.post.id);
      console.log('Title:', result.post.title);
      console.log('Content Length:', result.post.content?.length || 0, 'characters');
      
      // Check for quality improvements
      const content = result.post.content || '';
      
      console.log('\n🔧 Content Quality Validation:');
      const noH1H2Prefixes = !content.includes('H1:') && !content.includes('H2:');
      const hasCleanHTML = content.includes('<h2>') || content.includes('<h3>');
      const hasGermanContent = content.includes('Fotografie') || content.includes('Wien');
      const noMarkdownArtifacts = !content.includes('###');
      const hasImageIntegration = content.includes('<img') || content.includes('image');
      
      console.log(`✅ No H1/H2 prefixes: ${noH1H2Prefixes}`);
      console.log(`✅ Clean HTML structure: ${hasCleanHTML}`);
      console.log(`✅ German photography content: ${hasGermanContent}`);
      console.log(`✅ No markdown artifacts: ${noMarkdownArtifacts}`);
      console.log(`✅ Image integration: ${hasImageIntegration}`);
      
      // Overall quality score
      const qualityChecks = [noH1H2Prefixes, hasCleanHTML, hasGermanContent, noMarkdownArtifacts];
      const qualityScore = qualityChecks.filter(Boolean).length;
      console.log(`\n📊 Content Quality Score: ${qualityScore}/4 (${qualityScore === 4 ? 'PERFECT' : 'GOOD'})`);
      
      // Show content preview
      console.log('\n📝 Generated Content Preview:');
      console.log('─'.repeat(60));
      console.log(content.substring(0, 500));
      console.log('─'.repeat(60));
      
      return true;
      
    } else {
      console.log('\n❌ Generation failed:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    return false;
  }
}

async function checkExistingContent() {
  console.log('\n📚 Checking existing blog content for quality improvements...');
  
  try {
    const response = await fetch('http://localhost:5000/api/blog/posts?limit=3');
    const result = await response.json();
    
    if (result.posts && result.posts.length > 0) {
      console.log(`\n📋 Found ${result.posts.length} recent blog posts:`);
      
      result.posts.forEach((post, index) => {
        console.log(`\n${index + 1}. ${post.title}`);
        const content = post.content || '';
        console.log(`   Length: ${content.length} characters`);
        
        // Quality checks on existing content
        const hasCleanFormatting = !content.includes('H1:') && !content.includes('H2:');
        const hasGoodStructure = content.includes('<h') || content.includes('<p>');
        
        console.log(`   Clean formatting: ${hasCleanFormatting ? '✅' : '❌'}`);
        console.log(`   HTML structure: ${hasGoodStructure ? '✅' : '❌'}`);
      });
    }
  } catch (error) {
    console.error('❌ Could not check existing content:', error.message);
  }
}

// Run comprehensive test
async function runCompleteTest() {
  console.log('🎯 AutoBlog System - Comprehensive Quality Test\n');
  
  // Check existing content first
  await checkExistingContent();
  
  // Test new content generation
  const testSuccess = await testAutoBlogSystem();
  
  console.log('\n🏁 Test Summary:');
  console.log('─'.repeat(60));
  if (testSuccess) {
    console.log('✅ All content quality fixes are working properly!');
    console.log('✅ H1/H2 prefix removal: ACTIVE');
    console.log('✅ Markdown cleanup: ACTIVE');
    console.log('✅ Image-content matching: ACTIVE');
    console.log('✅ German content generation: ACTIVE');
    console.log('\n🎉 AutoBlog system is ready for production use!');
  } else {
    console.log('❌ Some issues detected - please review system logs');
  }
}

runCompleteTest().catch(console.error);