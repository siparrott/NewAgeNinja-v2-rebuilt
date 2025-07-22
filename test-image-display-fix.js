#!/usr/bin/env node

/**
 * FINAL IMAGE DISPLAY TEST AND FIX
 */

const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixImageDisplay() {
  console.log('🔧 FIXING IMAGE DISPLAY ISSUE...\n');
  
  try {
    // Get current blog post content
    const result = await pool.query(`
      SELECT id, title, content_html 
      FROM blog_posts 
      WHERE id = 'd5af2ff9-efa3-4afb-9e36-f4121988d10a'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Blog post not found');
      return;
    }
    
    const post = result.rows[0];
    console.log('📝 Post found:', post.title);
    
    // Show current image tag
    const imageMatch = post.content_html.match(/<img[^>]*>/);
    console.log('🖼️ Current image tag:', imageMatch?.[0] || 'NO IMAGE TAG FOUND');
    
    // Create proper image HTML
    const properImageHTML = `<figure style="margin: 30px 0; text-align: center;">
<img src="http://localhost:5000/blog-images/autoblog-1753174950138-1.jpg" alt="Professionelle Familienfotografie Session bei New Age Fotografie in Wien - Bild 1" style="width: 100%; max-width: 600px; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: block; margin: 0 auto;">
</figure>`;
    
    // Replace all malformed image tags with proper ones
    let fixedContent = post.content_html;
    
    // Remove any existing img tags
    fixedContent = fixedContent.replace(/<figure[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/figure>/g, '');
    fixedContent = fixedContent.replace(/<img[^>]*>/g, '');
    
    // Insert proper image after first H2 section
    const h2Match = fixedContent.match(/(<h2[^>]*>.*?<\/h2>.*?<\/p>)/s);
    if (h2Match) {
      const insertPoint = h2Match.index + h2Match[0].length;
      fixedContent = fixedContent.slice(0, insertPoint) + '\n\n' + properImageHTML + '\n\n' + fixedContent.slice(insertPoint);
    } else {
      // Insert at beginning if no H2 found
      fixedContent = properImageHTML + '\n\n' + fixedContent;
    }
    
    // Update database
    await pool.query(`
      UPDATE blog_posts 
      SET content_html = $1 
      WHERE id = $2
    `, [fixedContent, post.id]);
    
    console.log('✅ FIXED IMAGE DISPLAY');
    console.log('🎯 Image should now be visible in frontend');
    
    // Test image accessibility
    const fetch = require('node-fetch');
    try {
      const imageResponse = await fetch('http://localhost:5000/blog-images/autoblog-1753174950138-1.jpg');
      console.log('📸 Image accessibility test:', imageResponse.status === 200 ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
    } catch (e) {
      console.log('📸 Image accessibility test: ❌ ERROR -', e.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixImageDisplay();