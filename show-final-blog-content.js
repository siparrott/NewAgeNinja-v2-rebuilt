/**
 * Fix blog formatting and restore proper structure
 */

import fetch from 'node-fetch';

console.log('🔧 FIXING: Blog post formatting to restore proper display...');

async function fixBlogFormatting() {
  try {
    // Call the fix formatting API endpoint
    const response = await fetch('http://localhost:5000/api/blog/posts/fix-formatting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    console.log('✅ Formatting fix result:', result);
    
    // Now show the first blog post to verify the fix
    const postsResponse = await fetch('http://localhost:5000/api/blog/posts?limit=1');
    const postsData = await postsResponse.json();
    const firstPost = postsData.posts[0];
    
    if (firstPost) {
      console.log('\n📝 FIRST BLOG POST AFTER FIX:');
      console.log('=================================');
      console.log('Title:', firstPost.title);
      console.log('Content preview:', firstPost.content.substring(0, 500) + '...');
      console.log('Has <p> tags:', firstPost.content.includes('<p>') ? '✅' : '❌');
      console.log('Has <h2> tags:', firstPost.content.includes('<h2>') ? '✅' : '❌');
      console.log('Content length:', firstPost.content.length);
      
      // Count structural elements
      const paragraphs = (firstPost.content.match(/<p>/g) || []).length;
      const headings = (firstPost.content.match(/<h2>/g) || []).length;
      
      console.log(`\n📊 STRUCTURE ANALYSIS:`);
      console.log(`Paragraphs: ${paragraphs}`);
      console.log(`H2 headings: ${headings}`);
      console.log(`Total HTML elements: ${paragraphs + headings}`);
      
      if (paragraphs > 5 && headings > 1) {
        console.log('🎉 SUCCESS: Blog post now has proper structure for display!');
      } else {
        console.log('⚠️ WARNING: Blog post may still need manual formatting');
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing blog formatting:', error.message);
  }
}

// Run the fix
fixBlogFormatting();