// Test AutoBlog without images to isolate the issue
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

async function testNoImageBlog() {
  try {
    console.log('Testing OpenAI without images...');
    
    const prompt = `You are a professional business content writer specializing in photography industry marketing materials for New Age Fotografie photography studio in Vienna, Austria.

**BUSINESS OBJECTIVE:**
Write a marketing blog article about professional photography services to attract potential clients.

**BUSINESS CONTEXT:**
Photography studio information: Studio: New Age Fotografie
Location: Vienna, Austria
Services: Family, newborn, maternity, and portrait photography
Brand Voice: Professional, warm, and personal
Key Features: High-quality photography, professional editing, personal service
Photography session description: Professional business portrait photography session in Vienna studio

**TARGET AUDIENCE:**
Business clients seeking professional photography services in Vienna.

**INSTRUCTIONS:**
Create a business marketing blog post about photography services. Respond only with valid JSON matching this schema:

{
  "title": "Blog post title (max 140 chars)",
  "keyphrase": "2-4 word SEO keyphrase (max 60 chars)",
  "slug": "kebab-case-url-slug (lowercase, alphanumeric + hyphens only)",
  "excerpt": "Brief summary for previews (max 180 chars, plain text)",
  "content_html": "Full HTML blog post content",
  "seo_title": "SEO-optimized title for search engines (max 70 chars)",
  "meta_description": "Meta description for search results (max 160 chars)",
  "cover_image": null,
  "image_alts": ["Alt text for image 1", "Alt text for image 2", "Alt text for image 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "status": "DRAFT",
  "publish_now": false,
  "language": "de"
}

Remember: Output ONLY valid JSON. No markdown, no explanations, no additional text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    
    if (content) {
      console.log('✅ Success! OpenAI works without images');
      console.log('Response length:', content.length);
      const parsed = JSON.parse(content);
      console.log('Title:', parsed.title);
      console.log('Content length:', parsed.content_html?.length || 0);
      return true;
    } else {
      console.log('❌ Failed even without images');
      console.log('Response:', response.choices[0]?.message);
      return false;
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

testNoImageBlog();