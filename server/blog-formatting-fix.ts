/**
 * Blog Formatting Fix - Convert plain text to structured HTML
 * Restores proper blog post formatting with H2 sections and paragraph breaks
 */

export function convertPlainTextToStructuredHTML(content: string): string {
  if (!content || content.includes('<h2>')) {
    return content; // Already formatted
  }

  console.log('Converting plain text to structured HTML...');
  
  // Split content into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let structuredHTML = '';
  
  // Group sentences into paragraphs (3-4 sentences per paragraph)
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const paragraph = sentences.slice(i, i + 3).join('. ').trim() + '.';
    if (paragraph.length > 20) {
      paragraphs.push(paragraph);
    }
  }
  
  // Create structured content with H2 headings every 2-3 paragraphs
  const sectionHeadings = [
    'Professionelle Fotografie in Wien',
    'Unser Ansatz bei der Familienfotografie',
    'Tipps für Ihre nächste Fotosession',
    'Die Bedeutung authentischer Momente',
    'Warum New Age Fotografie wählen'
  ];
  
  let headingIndex = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    // Add H2 heading every 2-3 paragraphs
    if (i > 0 && i % 3 === 0 && headingIndex < sectionHeadings.length) {
      structuredHTML += `\n<h2>${sectionHeadings[headingIndex]}</h2>\n`;
      headingIndex++;
    }
    
    structuredHTML += `<p>${paragraphs[i]}</p>\n`;
  }
  
  return structuredHTML;
}

export async function fixAllBlogPosts() {
  try {
    const response = await fetch('http://localhost:5000/api/blog/posts?limit=50');
    const data = await response.json();
    const posts = data.posts || [];
    
    console.log(`Checking ${posts.length} blog posts for formatting issues...`);
    
    for (const post of posts) {
      const content = post.content || '';
      
      // Check if content needs formatting (wall of text without HTML structure)
      const needsFormatting = content.length > 300 && 
                             !content.includes('<h2>') && 
                             !content.includes('<p>') &&
                             content.split('.').length > 5;
      
      if (needsFormatting) {
        console.log(`Fixing formatting for post: ${post.title}`);
        
        const structuredContent = convertPlainTextToStructuredHTML(content);
        
        const updateResponse = await fetch(`http://localhost:5000/api/blog/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: structuredContent,
            contentHtml: structuredContent
          })
        });
        
        if (updateResponse.ok) {
          console.log(`✅ Fixed: ${post.title}`);
        } else {
          console.log(`❌ Failed to fix: ${post.title}`);
        }
      }
    }
    
    console.log('Blog formatting fix completed!');
    
  } catch (error) {
    console.error('Error fixing blog formatting:', error);
  }
}