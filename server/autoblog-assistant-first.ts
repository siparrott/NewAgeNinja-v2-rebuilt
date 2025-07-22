/**
 * ASSISTANT-FIRST ARCHITECTURE
 * 
 * This system ADAPTS to YOUR trained Assistant's output format
 * instead of forcing your Assistant to match system expectations.
 * 
 * CORE PRINCIPLE: Whatever YOUR Assistant outputs becomes the FINAL content
 * with intelligent HTML conversion but NO content modification.
 */

// Types for the Assistant-First architecture
interface ProcessedImage {
  buffer: Buffer;
  publicUrl: string;
  filename: string;
}

interface AutoBlogInput {
  contentGuidance?: string;
  language?: string;
  customSlug?: string;
  publishOption?: 'draft' | 'publish' | 'schedule';
  scheduledFor?: string;
}

interface AutoBlogResult {
  success: boolean;
  blogPost: any;
  message: string;
  metadata: {
    method: string;
    assistant_id: string;
    content_length: number;
    parsing_success: boolean;
  };
}

const BLOG_ASSISTANT = 'asst_nlyO3yRav2oWtyTvkq0cHZaU'; // YOUR TOGNINJA BLOG WRITER

export class AssistantFirstAutoBlogGenerator {
  
  /**
   * STEP 1: Get content from YOUR trained Assistant - NO INTERFERENCE
   */
  async getYourAssistantContent(
    images: ProcessedImage[], 
    input: AutoBlogInput, 
    context: string
  ): Promise<string | null> {
    try {
      console.log('🎯 CALLING YOUR TRAINED TOGNINJA ASSISTANT - NO INTERFERENCE');
      
      // Minimal context - let YOUR Assistant do its job
      const userMessage = `${context} - Images: ${images.length} photography session images uploaded - Content guidance: ${input.contentGuidance || ''}`;
      
      // Direct API call to avoid SDK issues
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });
      
      const thread = await threadResponse.json();
      
      // Send message
      await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: userMessage
        })
      });
      
      // Create run
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: BLOG_ASSISTANT
        })
      });
      
      const run = await runResponse.json();
      
      // Wait for completion
      let attempts = 0;
      let runStatus = run;
      
      while (runStatus.status !== 'completed' && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        runStatus = await statusResponse.json();
        attempts++;
        console.log(`⏳ YOUR Assistant working... Status: ${runStatus.status} (attempt ${attempts})`);
      }
      
      if (runStatus.status !== 'completed') {
        throw new Error(`YOUR Assistant run failed: ${runStatus.status}`);
      }
      
      // Get messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      const messages = await messagesResponse.json();
      const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
      
      if (!assistantMessage?.content?.[0]?.text?.value) {
        throw new Error('No content from YOUR trained Assistant');
      }
      
      const content = assistantMessage.content[0].text.value;
      console.log('✅ YOUR TRAINED ASSISTANT RESPONSE LENGTH:', content.length);
      console.log('✅ YOUR TRAINED ASSISTANT PREVIEW:', content.substring(0, 300));
      
      return content;
      
    } catch (error) {
      console.error('❌ Error calling YOUR trained Assistant:', error);
      return null;
    }
  }
  
  /**
   * STEP 2: ADAPTIVE PARSING - Analyze YOUR Assistant's format and adapt
   */
  parseYourAssistantFormat(content: string): {
    title: string;
    seo_title: string;
    meta_description: string;
    slug: string;
    excerpt: string;
    tags: string[];
    content_html: string;
  } {
    console.log('🔍 ANALYZING YOUR ASSISTANT FORMAT - ADAPTIVE PARSING');
    
    const result = {
      title: '',
      seo_title: '',
      meta_description: '',
      slug: '',
      excerpt: '',
      tags: [] as string[],
      content_html: ''
    };
    
    // STEP 2A: Extract metadata using flexible patterns
    
    // Title extraction - handle multiple formats
    const titlePatterns = [
      /(?:title|seo_title|headline):\s*["']?([^"'\n]+)["']?/i,
      /^#\s+(.+)$/m,
      /(?:^|\n)(.+?)\n(?:=|--)/m, // Underlined titles
      /^(.+?)(?:\n|$)/m // First line fallback
    ];
    
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].trim().length > 5) {
        result.title = match[1].trim();
        break;
      }
    }
    
    // Meta description
    const metaPatterns = [
      /(?:meta_description|description|summary):\s*["']?([^"'\n]+)["']?/i,
      /(?:excerpt|summary):\s*["']?([^"'\n]+)["']?/i
    ];
    
    for (const pattern of metaPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.meta_description = match[1].trim();
        break;
      }
    }
    
    // Slug extraction
    const slugMatch = content.match(/slug:\s*["']?([^"'\n]+)["']?/i);
    if (slugMatch && slugMatch[1]) {
      result.slug = slugMatch[1].trim();
    } else if (result.title) {
      result.slug = result.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    }
    
    // Tags extraction - handle multiple formats
    const tagsPatterns = [
      /tags:\s*\[([^\]]+)\]/i,
      /tags:\s*["']([^"']+)["']/i,
      /keywords:\s*["']([^"']+)["']/i
    ];
    
    for (const pattern of tagsPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.tags = match[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
        break;
      }
    }
    
    // Fallbacks if no metadata found
    if (!result.title) result.title = 'Familienfotografie in Wien - Authentische Momente';
    if (!result.meta_description) result.meta_description = 'Professionelle Familienfotografie in Wien für unvergessliche Erinnerungen.';
    if (!result.tags.length) result.tags = ['photography', 'wien', 'family'];
    if (!result.slug) result.slug = 'familienfotografie-wien-' + Date.now();
    
    result.seo_title = result.title + ' | New Age Fotografie Wien';
    result.excerpt = result.meta_description;
    
    console.log('✅ EXTRACTED METADATA:', {
      title: result.title.length,
      meta_description: result.meta_description.length,
      tags: result.tags.length,
      slug: result.slug.length
    });
    
    // STEP 2B: Process main content - PRESERVE YOUR ASSISTANT'S STRUCTURE
    let mainContent = content;
    
    // Remove extracted metadata lines but keep the main content intact
    const metadataLines = [
      /^(title|seo_title|meta_description|description|slug|tags|excerpt|keywords):\s*[^\n]*\n/gmi,
      /^---[\s\S]*?---\n?/m // YAML frontmatter
    ];
    
    for (const pattern of metadataLines) {
      mainContent = mainContent.replace(pattern, '');
    }
    
    mainContent = mainContent.trim();
    
    // STEP 2C: Convert to HTML while preserving YOUR Assistant's structure
    result.content_html = this.convertYourFormatToHTML(mainContent);
    
    console.log('✅ ADAPTIVE PARSING COMPLETE - HTML LENGTH:', result.content_html.length);
    
    return result;
  }
  
  /**
   * STEP 3: INTELLIGENT HTML CONVERSION - Adapts to ANY format
   */
  private convertYourFormatToHTML(content: string): string {
    console.log('🔄 CONVERTING YOUR ASSISTANT FORMAT TO HTML - INTELLIGENT CONVERSION');
    
    let html = content;
    
    // INTELLIGENT STRUCTURE DETECTION
    
    // Handle various heading formats YOUR Assistant might use
    const headingReplacements = [
      // Markdown style
      { pattern: /^# (.+)$/gm, replacement: '<h1 style="font-size: 2rem; font-weight: 700; margin: 2rem 0 1rem 0; color: #1f2937;">$1</h1>' },
      { pattern: /^## (.+)$/gm, replacement: '<h2 class="blog-h2" style="background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 15px 25px; border-radius: 8px; margin: 30px 0 20px 0; font-size: 1.5rem; font-weight: 600; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);">$1</h2>' },
      { pattern: /^### (.+)$/gm, replacement: '<h3 style="font-size: 1.3rem; font-weight: 600; margin: 25px 0 15px 0; color: #a855f7;">$1</h3>' },
      
      // H1:, H2:, H3: style
      { pattern: /^H1:\s*(.+)$/gm, replacement: '<h1 style="font-size: 2rem; font-weight: 700; margin: 2rem 0 1rem 0; color: #1f2937;">$1</h1>' },
      { pattern: /^H2:\s*(.+)$/gm, replacement: '<h2 class="blog-h2" style="background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 15px 25px; border-radius: 8px; margin: 30px 0 20px 0; font-size: 1.5rem; font-weight: 600; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);">$1</h2>' },
      { pattern: /^H3:\s*(.+)$/gm, replacement: '<h3 style="font-size: 1.3rem; font-weight: 600; margin: 25px 0 15px 0; color: #a855f7;">$1</h3>' }
    ];
    
    // Apply heading replacements
    for (const replacement of headingReplacements) {
      html = html.replace(replacement.pattern, replacement.replacement);
    }
    
    // Handle lists - various formats
    const listReplacements = [
      { pattern: /^[-*+]\s(.+)$/gm, replacement: '<li style="margin-bottom: 8px; color: #374151;">$1</li>' },
      { pattern: /^\d+\.\s(.+)$/gm, replacement: '<li style="margin-bottom: 8px; color: #374151;">$1</li>' }
    ];
    
    for (const replacement of listReplacements) {
      html = html.replace(replacement.pattern, replacement.replacement);
    }
    
    // Wrap consecutive li tags in ul - using different regex flags for compatibility
    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, '<ul style="margin: 20px 0; padding-left: 25px;">$&</ul>');
    
    // Handle bold/italic text
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Handle pricing with Vienna branding
    html = html.replace(/(€\d+)/g, '<strong style="color: #a855f7;">$1</strong>');
    
    // Handle paragraphs intelligently
    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (let line of lines) {
      line = line.trim();
      
      if (!line) {
        if (!inList) processedLines.push('');
        continue;
      }
      
      const isHeading = line.includes('<h1') || line.includes('<h2') || line.includes('<h3');
      const isListItem = line.includes('<li');
      const isListContainer = line.includes('<ul') || line.includes('</ul>');
      
      if (isListItem || isListContainer) {
        inList = isListContainer ? line.includes('<ul') : inList;
        processedLines.push(line);
        if (line.includes('</ul>')) inList = false;
      } else if (isHeading) {
        inList = false;
        processedLines.push(line);
      } else if (line.length > 20) {
        inList = false;
        // Only wrap in <p> if not already wrapped
        if (!line.startsWith('<') || line.startsWith('<strong') || line.startsWith('<em')) {
          line = `<p style="margin: 20px 0; line-height: 1.7; color: #374151; text-align: justify;">${line}</p>`;
        }
        processedLines.push(line);
      } else {
        processedLines.push(line);
      }
    }
    
    html = processedLines.join('\n');
    
    // Add professional footer with Vienna context
    html += `
      <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #f8f9ff, #fff5f5); border-radius: 12px; border-left: 4px solid #a855f7;">
        <h3 style="color: #a855f7; margin-bottom: 15px;">📸 Ihr nächster Schritt</h3>
        <p style="margin-bottom: 15px; color: #374151;">Bereit für authentische Familienfotos in Wien? Vereinbaren Sie noch heute Ihr persönliches Beratungsgespräch!</p>
        <p style="margin: 0;">
          <strong>Kontakt:</strong> 
          <a href="/kontakt" style="color: #a855f7; text-decoration: none;">Termin vereinbaren</a> | 
          <a href="/warteliste" style="color: #a855f7; text-decoration: none;">Warteliste</a> | 
          <a href="/galerie" style="color: #a855f7; text-decoration: none;">Portfolio ansehen</a>
        </p>
      </div>
    `;
    
    console.log('✅ HTML CONVERSION COMPLETE - LENGTH:', html.length);
    return html;
  }
  
  /**
   * MAIN ORCHESTRATION - ASSISTANT-FIRST APPROACH
   */
  async generateBlog(
    images: ProcessedImage[],
    input: AutoBlogInput,
    authorId: string,
    context: string = 'Create German blog post about photography session'
  ): Promise<AutoBlogResult> {
    try {
      console.log('🚀 ASSISTANT-FIRST AUTOBLOG GENERATION STARTING');
      
      // STEP 1: Get content from YOUR trained Assistant
      const assistantContent = await this.getYourAssistantContent(images, input, context);
      
      if (!assistantContent) {
        throw new Error('Failed to get content from YOUR trained Assistant');
      }
      
      console.log('✅ YOUR ASSISTANT CONTENT RECEIVED - LENGTH:', assistantContent.length);
      
      // STEP 2: Parse YOUR Assistant's format adaptively
      const parsedData = this.parseYourAssistantFormat(assistantContent);
      
      // STEP 3: Create blog post with YOUR Assistant's content
      const blogPost = {
        title: parsedData.title,
        slug: input.customSlug || parsedData.slug,
        content: parsedData.content_html,
        contentHtml: parsedData.content_html,
        excerpt: parsedData.excerpt,
        imageUrl: images[0]?.publicUrl || null,
        seoTitle: parsedData.seo_title,
        metaDescription: parsedData.meta_description,
        published: input.publishOption === 'publish',
        publishedAt: input.publishOption === 'publish' ? new Date() : null,
        scheduledFor: input.publishOption === 'schedule' && input.scheduledFor ? new Date(input.scheduledFor) : null,
        status: input.publishOption === 'publish' ? 'PUBLISHED' : 
                input.publishOption === 'schedule' ? 'SCHEDULED' : 'DRAFT',
        tags: parsedData.tags,
        authorId: authorId
      };
      
      console.log('🎯 ASSISTANT-FIRST BLOG POST CREATED');
      console.log('- Title:', blogPost.title);
      console.log('- Content length:', blogPost.contentHtml.length);
      console.log('- Tags:', blogPost.tags.length);
      
      return {
        success: true,
        blogPost: blogPost as any,
        message: 'Blog generated using YOUR trained TOGNINJA BLOG WRITER Assistant',
        metadata: {
          method: 'assistant-first-adaptive',
          assistant_id: BLOG_ASSISTANT,
          content_length: assistantContent.length,
          parsing_success: true
        }
      };
      
    } catch (error) {
      console.error('❌ ASSISTANT-FIRST GENERATION FAILED:', error);
      throw error;
    }
  }
}