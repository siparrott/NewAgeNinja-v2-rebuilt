import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

async function testAutoBlogDebug() {
  try {
    // Use actual family photo for realistic testing
    const testImageBuffer = fs.readFileSync('attached_assets/image_1752814183389.png');

    const form = new FormData();
    form.append('userPrompt', 'Test family photography session for debugging content generation');
    form.append('language', 'de');
    form.append('publishOption', 'draft');
    form.append('siteUrl', 'https://www.newagefotografie.com');
    form.append('images', testImageBuffer, { 
      filename: 'test-family.png', 
      contentType: 'image/png' 
    });

    console.log('🔍 Testing AutoBlog system with debug mode...');
    
    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer test-token',
        ...form.getHeaders()
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers.raw());
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ AutoBlog test SUCCESS');
      console.log('📝 Generated post ID:', result.post?.id);
      console.log('🧠 Has AI content:', !!result.ai);
      console.log('🔑 AI content keys:', result.ai ? Object.keys(result.ai) : 'none');
      console.log('📄 Content HTML length:', result.ai?.content_html?.length || 0);
      console.log('📝 Title:', result.ai?.title || 'none');
      console.log('🏷️ SEO Title:', result.ai?.seo_title || 'none');
      
      if (result.ai?.content_html) {
        console.log('📄 Content HTML preview:', result.ai.content_html.substring(0, 300) + '...');
      }
      
      console.log('\n🔍 Database check - fetching created post...');
      const postCheck = await fetch(`http://localhost:5000/api/blog/posts/${result.post.slug}`);
      if (postCheck.ok) {
        const postData = await postCheck.json();
        console.log('💾 Database content length:', postData.content?.length || 0);
        console.log('💾 Database contentHtml length:', postData.contentHtml?.length || 0);
        console.log('💾 Database excerpt:', postData.excerpt || 'none');
        
        if (postData.content || postData.contentHtml) {
          console.log('✅ SUCCESS: Content saved to database');
        } else {
          console.log('❌ ISSUE: Content NOT saved to database');
        }
      }
    } else {
      const error = await response.text();
      console.log('❌ AutoBlog test FAILED');
      console.log('🚨 Error response:', error);
    }
  } catch (err) {
    console.error('💥 Test error:', err.message);
  }
}

testAutoBlogDebug();