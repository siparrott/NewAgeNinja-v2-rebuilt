// Display the generated blog post content
import fetch from 'node-fetch';

async function showGeneratedBlog() {
  try {
    console.log('=== Generated Blog Post ===');
    
    const response = await fetch('http://localhost:5000/api/blog/posts/neugeborenenfotografie-wien-unvergessliche-momente');
    const post = await response.json();
    
    console.log('📄 Title:', post.title);
    console.log('🔗 SEO Title:', post.seoTitle);
    console.log('📝 Meta Description:', post.metaDescription);
    console.log('🏷️  Tags:', post.tags);
    console.log('📅 Published:', post.publishedAt);
    console.log('🖼️  Cover Image:', post.imageUrl);
    console.log('📊 Status:', post.status);
    
    console.log('\n=== Content Preview ===');
    console.log(post.contentHtml.substring(0, 800) + '...');
    
    // Show image analysis
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const matches = [...post.contentHtml.matchAll(imageRegex)];
    console.log('\n🖼️  Embedded Images:');
    matches.forEach((match, i) => {
      console.log(`${i + 1}. ${match[1]}`);
    });
    
    console.log('\n=== Content Structure ===');
    console.log('Has H1:', post.contentHtml.includes('<h1>'));
    console.log('Has H2:', post.contentHtml.includes('<h2>'));
    console.log('Has images:', post.contentHtml.includes('<img'));
    console.log('Has paragraphs:', post.contentHtml.includes('<p>'));
    console.log('Total length:', post.contentHtml.length, 'characters');
    
    console.log('\n✅ Blog post generated successfully with your OpenAI Assistant integration!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showGeneratedBlog();