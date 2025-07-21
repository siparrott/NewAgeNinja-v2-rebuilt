/**
 * Fix blog post formatting - convert wall of text to properly structured HTML
 */

import fetch from 'node-fetch';

console.log('🔧 FIXING: Blog post formatting issue...');

async function fixBlogFormatting() {
  try {
    // Get the problematic blog post
    const response = await fetch('http://localhost:5000/api/blog/posts?limit=5');
    const data = await response.json();
    const posts = data.posts || [];
    
    console.log(`📊 Found ${posts.length} blog posts to potentially fix`);
    
    for (const post of posts) {
      // Check if post content needs formatting fixes
      const content = post.content || '';
      const hasWallOfText = content.length > 500 && !content.includes('<p>') && !content.includes('<h2>');
      
      if (hasWallOfText) {
        console.log(`🚨 Post "${post.title}" has wall-of-text formatting issue`);
        console.log(`📏 Content length: ${content.length} characters`);
        console.log(`🏗️ HTML structure present: ${content.includes('<h2>') ? 'Yes' : 'No'}`);
        
        // Create structured HTML from plain text
        const structuredContent = convertPlainTextToStructuredHTML(content);
        
        // Update the post with properly formatted content
        const updateResponse = await fetch(`http://localhost:5000/api/blog/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: structuredContent,
            excerpt: generateExcerpt(structuredContent)
          })
        });
        
        if (updateResponse.ok) {
          console.log(`✅ Fixed formatting for: ${post.title}`);
        } else {
          console.log(`❌ Failed to update: ${post.title}`);
        }
      } else {
        console.log(`✅ Post "${post.title}" already has proper formatting`);
      }
    }
    
    console.log('🎉 Blog formatting fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing blog formatting:', error.message);
  }
}

function convertPlainTextToStructuredHTML(plainText) {
  console.log('🔄 Converting plain text to structured HTML...');
  
  // Split by double line breaks to find paragraphs
  let paragraphs = plainText.split('\n\n').filter(p => p.trim().length > 0);
  
  // If no clear paragraph breaks, split by periods followed by spaces
  if (paragraphs.length <= 2) {
    paragraphs = plainText.split('. ').map(p => p.trim() + (p.endsWith('.') ? '' : '.'));
  }
  
  let structuredHTML = '';
  let sectionCount = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (paragraph.length === 0) continue;
    
    // Every 3rd paragraph becomes an H2 section
    if (i > 0 && i % 3 === 0 && sectionCount < 4) {
      sectionCount++;
      const headingText = generateSectionHeading(paragraph, sectionCount);
      structuredHTML += `<h2>${headingText}</h2>\n`;
    }
    
    // Convert paragraph to proper HTML
    structuredHTML += `<p>${paragraph}</p>\n`;
  }
  
  console.log(`✅ Converted ${paragraphs.length} paragraphs with ${sectionCount} H2 sections`);
  return structuredHTML;
}

function generateSectionHeading(content, sectionNumber) {
  const headings = [
    'Professionelle Fototechniken im Studio',
    'Tipps für Ihre Fotosession in Wien',
    'Die Bedeutung authentischer Familienmomente',
    'Unser Ansatz bei New Age Fotografie'
  ];
  
  return headings[sectionNumber - 1] || `Fotografie-Einblicke ${sectionNumber}`;
}

function generateExcerpt(htmlContent) {
  // Strip HTML and get first 150 characters
  const plainText = htmlContent.replace(/<[^>]*>/g, '');
  return plainText.substring(0, 150).trim() + '...';
}

// Run the fix
fixBlogFormatting();