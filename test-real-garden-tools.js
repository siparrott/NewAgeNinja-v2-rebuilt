#!/usr/bin/env node

/**
 * TEST: REAL GARDEN TOOLS CONTENT GENERATION
 * This will prove the system generates appropriate content for garden tools
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

console.log('🔧 TESTING REAL GARDEN TOOLS AUTOBLOG GENERATION\n');

async function testGardenToolsGeneration() {
  try {
    // Create form data with the actual garden tools image
    const form = new FormData();
    form.append('contentGuidance', 'Generate a comprehensive review of essential garden tools for home gardeners');
    form.append('publishOption', 'draft');
    form.append('customSlug', `garden-tools-essential-guide-${Date.now()}`);
    
    // Add the actual garden tools image
    const imagePath = 'attached_assets/Best-Gardening-Tools-Names-with-Pictures-and-Their-Uses_1753175928150.webp';
    if (fs.existsSync(imagePath)) {
      form.append('images', fs.createReadStream(imagePath));
      console.log('✅ Added REAL garden tools image to form');
    } else {
      console.log('❌ Garden tools image not found at:', imagePath);
      return;
    }

    console.log('🚀 SENDING REQUEST TO AUTOBLOG SYSTEM...');
    
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });

    if (!response.ok) {
      console.log('❌ Request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ AUTOBLOG GENERATION COMPLETED\n');
    
    if (result.success && result.post) {
      console.log('📊 GENERATED CONTENT ANALYSIS:');
      console.log(`   Title: ${result.post.title}`);
      console.log(`   Slug: ${result.post.slug}`);
      console.log(`   Content Length: ${result.post.content?.length || result.post.contentHtml?.length || 0} characters`);
      console.log(`   SEO Title: ${result.post.seoTitle || 'Not set'}`);
      console.log(`   Meta Description: ${result.post.metaDescription || 'Not set'}`);
      console.log('');
      
      // Check if content is garden tools related
      const content = result.post.content || result.post.contentHtml || '';
      const gardenKeywords = [
        'garden', 'tools', 'spade', 'rake', 'shovel', 'hose', 'pruning', 
        'gardening', 'landscaping', 'plants', 'soil', 'watering'
      ];
      
      const foundKeywords = gardenKeywords.filter(keyword => 
        content.toLowerCase().includes(keyword)
      );
      
      console.log('🎯 CONTENT RELEVANCE CHECK:');
      console.log(`   Garden-related keywords found: ${foundKeywords.length}/${gardenKeywords.length}`);
      console.log(`   Keywords: ${foundKeywords.join(', ')}`);
      
      if (foundKeywords.length >= 3) {
        console.log('   ✅ CONTENT IS GARDEN TOOLS RELATED');
      } else {
        console.log('   ❌ CONTENT DOES NOT MATCH GARDEN TOOLS THEME');
      }
      
      console.log('\n🔍 CONTENT PREVIEW (first 300 chars):');
      console.log(content.substring(0, 300) + '...');
      
    } else {
      console.log('❌ Generation failed:', result.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

// Run the test
testGardenToolsGeneration();