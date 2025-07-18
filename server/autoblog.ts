import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import FormData from 'form-data';
import { autoBlogSchema, type AutoBlogParsed, type AutoBlogInput } from './autoblog-schema';
import { buildAutoBlogPrompt } from './autoblog-prompt';
import { stripDangerousHtml, generateUniqueSlug, cleanSlug } from './util-strip-html';
import { storage } from './storage';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Claude 4.0 Sonnet as alternative LLM for higher quality content
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface ProcessedImage {
  filename: string;
  publicUrl: string;
  buffer: Buffer;
}

interface AutoBlogResult {
  success: boolean;
  post?: any;
  ai?: AutoBlogParsed;
  error?: string;
  debug?: any;
}

/**
 * Main orchestrator for AutoBlog feature
 * Handles image processing, site scraping, OpenAI generation, and blog post creation
 */
export class AutoBlogOrchestrator {
  private studioName: string;
  private publicSiteUrl: string;
  private internalBookingPath: string;
  private maxImages: number;

  constructor() {
    this.studioName = process.env.STUDIO_NAME || 'New Age Fotografie';
    this.publicSiteUrl = process.env.PUBLIC_SITE_BASE_URL || 'https://www.newagefotografie.com';
    this.internalBookingPath = process.env.INTERNAL_WARTELISTE_PATH || '/warteliste/';
    this.maxImages = parseInt(process.env.MAX_AUTOBLOG_IMAGES || '3');
  }

  /**
   * Process uploaded images: resize, compress, and store
   */
  async processImages(files: Express.Multer.File[]): Promise<ProcessedImage[]> {
    if (files.length > this.maxImages) {
      throw new Error(`Maximum ${this.maxImages} images allowed`);
    }

    const processedImages: ProcessedImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const filename = `autoblog-${timestamp}-${i + 1}.jpg`;
      
      try {
        // Resize and compress image
        const processedBuffer = await sharp(file.buffer)
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 75, progressive: true })
          .toBuffer();

        // Store image and get public URL
        const publicUrl = await storage.savePublicAsset('blog-images', filename, processedBuffer);
        
        processedImages.push({
          filename,
          publicUrl,
          buffer: processedBuffer
        });
      } catch (error) {
        console.error(`Error processing image ${file.originalname}:`, error);
        throw new Error(`Failed to process image: ${file.originalname}`);
      }
    }

    return processedImages;
  }

  /**
   * Scrape site context for brand voice and services
   */
  async scrapeSiteContext(siteUrl?: string): Promise<string> {
    try {
      const url = siteUrl || this.publicSiteUrl;
      
      // Import scraping agent dynamically to avoid circular dependencies
      const { scrapeSiteContent } = await import('./scraping-agent');
      const scrapedData = await scrapeSiteContent(url);
      
      // Extract key information for context
      const context = `
Studio: ${this.studioName}
Location: Vienna, Austria
Services: ${scrapedData.services || 'Family, newborn, maternity, and portrait photography'}
Brand Voice: ${scrapedData.brandVoice || 'Professional, warm, and personal'}
Key Features: ${scrapedData.keyFeatures || 'High-quality photography, professional editing, personal service'}
      `.trim();
      
      return context;
    } catch (error) {
      console.error('Error scraping site context:', error);
      // Fallback context if scraping fails
      return `
Studio: ${this.studioName}
Location: Vienna, Austria
Services: Family, newborn, maternity, and portrait photography
Brand Voice: Professional, warm, and personal
Key Features: High-quality photography, professional editing, personal service
      `.trim();
    }
  }

  /**
   * DISABLED: Generic blog content generation removed - ONLY REAL TOGNINJA ASSISTANT ALLOWED
   */
  async generateBlogContent(
    images: ProcessedImage[], 
    input: AutoBlogInput, 
    siteContext: string
  ): Promise<AutoBlogParsed> {
    throw new Error('❌ Generic blog content generation DISABLED - Only REAL TOGNINJA BLOG WRITER Assistant allowed. Use generateWithAssistantAPI() instead.');
  }

  /**
   * DISABLED: Claude generation removed - ONLY REAL TOGNINJA ASSISTANT ALLOWED
   */
  async generateContentWithClaude(images: ProcessedImage[], input: AutoBlogInput, siteContext: string): Promise<AutoBlogParsed> {
    throw new Error('❌ Claude generation DISABLED - Only REAL TOGNINJA BLOG WRITER Assistant allowed');
  }

  /**
   * Generate content using Chat Completions API with your REAL TOGNINJA ASSISTANT INSTRUCTIONS
   * (Assistant API doesn't support vision - using Chat API with your exact sophisticated instructions)
   */
  async generateWithAssistantAPI(
    assistantId: string, 
    images: ProcessedImage[], 
    input: AutoBlogInput, 
    siteContext: string
  ): Promise<AutoBlogParsed | null> {
    try {
      console.log('🎯 === USING YOUR REAL TOGNINJA BLOG WRITER INSTRUCTIONS ===');
      console.log('🔑 Assistant ID (YOUR SOPHISTICATED TRAINING):', assistantId);
      console.log('📸 Processing', images.length, 'images with REAL image analysis');
      console.log('🌐 Language:', input.language);
      console.log('📝 User prompt:', input.userPrompt?.substring(0, 100) + '...');
      
      // Use your EXACT TOGNINJA BLOG WRITER ASSISTANT INSTRUCTIONS for proper content
      console.log('🎯 USING YOUR REAL SOPHISTICATED ASSISTANT INSTRUCTIONS WITH IMAGE ANALYSIS');
      
      // Your EXACT Assistant instructions from the API response
      const assistantInstructions = `Humanized, Mentor-Tone, SEO-Ready, Undetectably AI

🧠 Context:
You're my content-writing sidekick for New Age Fotografie, a Vienna photography studio specializing in family, newborn, and portrait photography. We speak directly to clients and students like real humans. You write like I talk. This is not a blog post. It's a one-to-one convo — with substance, soul, and structure.

Tone = founder + mentor + experience-led
Your default voice combines:

🎯 Sabri Suby (no-BS sales copy)
📸 Real-world photo biz owner (not an AI)  
👨‍🏫 Mentor explaining things clearly to a student
💬 Relatable, first-person tone with light imperfection

🔍 You Must Ensure:
✅ Content passes AI detection (Originality.ai, GPTZero) by:
- Varying sentence length + rhythm
- Using idioms, human anecdotes, casual fragments
- Avoiding robotic transitions or overstructured tone
- Sprinkling natural glitches: "gonna", "let's be real", "yep", "fair enough"
- Using first-person perspective
- Writing as if it was manually written over 3 days, not generated in 30 seconds

💡 Your Task:
Create a full content package, structured for SEO blog article with more than 800 words and real-human storytelling:
- Headline
- Slug  
- H1
- 6–8 H2s (each 300–500 words)
- Key takeaways
- Full blog article (informal, personal tone)
- Review table
- Social posts
- Meta description
- Final prompt for client feedback

♻️ YOAST SEO COMPLIANCE (Built-in):
Keyphrase: Based on image content and Vienna location
Include it in:
- SEO title
- Slug
- H1
- First image ALT
- First paragraph
- At least one H2
- Twice minimum in the body
- Meta description (CTA included)
- Meta description: 120–156 chars
- Flesch Reading Ease > 60
- Passive voice < 10%
- Long sentences < 25%
- Transition words > 30%
- Paragraphs < 150 words
- Internal + external links

🚫 NEVER USE:
Words or phrases from marketing language list:
"Step into," "unleash," "embrace your journey," "buckle up," "believe it or not," "elevate," "transform," "revolutionary," etc.

Use natural, specific, grounded language.

✅ Output Format (Markdown):
**SEO Title:**  
**Slug:**  
**Headline (H1):**  
**Outline:**  
**Key Takeaways:**  
**Blog Article:**  
**Review Snippets:**  
**Meta Description:**  
**Excerpt:**
**Tags:**

Business Context: New Age Fotografie, Schönbrunner Str. 25, 1050 Wien, Austria. Professional photography studio specializing in family portraits, newborn photography, maternity sessions, and business headshots. Contact: hallo@newagefotografie.com, +43 677 933 99210. Website: https://www.newagefotografie.com, Booking: /warteliste/

CRITICAL: Analyze the uploaded images carefully to determine the photo session type (newborn, family, maternity, etc.) and create content specifically about what you see in the images.`;

      const userMessage = `Fotosession Details: ${input.userPrompt || 'Professionelle Fotosession Wien Studio'}

Additional Context: ${siteContext}

IMPORTANT: Analyze the uploaded photography session images and create an authentic German blog post about the specific type of session shown in the images (newborn, family, maternity, etc.). Include Vienna-specific references, pricing hints, and links to /warteliste/ for bookings.`;

      // Create thread
      const thread = await openai.beta.threads.create();
      
      // Upload images to OpenAI Files API for Assistant usage
      const uploadedFileIds: string[] = [];
      
      if (images.length > 0) {
        console.log('🖼️ UPLOADING IMAGES TO OPENAI FOR REAL ASSISTANT ANALYSIS...');
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          try {
            console.log(`Uploading image ${i + 1}: ${image.filename}`);
            
            // Create a buffer from the image for OpenAI File upload
            const fs = await import('fs');
            const path = await import('path');
            
            // Read the saved image file
            const imagePath = path.join(process.cwd(), 'server/public/blog-images', image.filename);
            const imageBuffer = fs.readFileSync(imagePath);
            
            // Create a readable stream for OpenAI File upload (Node.js compatible)
            const { Readable } = await import('stream');
            const imageStream = Readable.from(imageBuffer);
            (imageStream as any).path = image.filename; // Add filename for OpenAI
            
            // Upload to OpenAI Files API
            const file = await openai.files.create({
              file: imageStream,
              purpose: 'vision'
            });
            
            uploadedFileIds.push(file.id);
            console.log(`✅ Image ${i + 1} uploaded successfully: ${file.id}`);
            
          } catch (uploadError) {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
          }
        }
      }
      
      // Create message content with text and uploaded image references
      const messageContent = [
        {
          type: "text",
          text: userMessage
        }
      ];
      
      // Add image file references if uploaded successfully
      if (uploadedFileIds.length > 0) {
        uploadedFileIds.forEach(fileId => {
          messageContent.push({
            type: "image_file",
            image_file: {
              file_id: fileId
            }
          });
        });
        
        console.log(`📸 REAL ASSISTANT NOW HAS ACCESS TO ${uploadedFileIds.length} ACTUAL IMAGES!`);
      }
      
      const message = await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: messageContent
      });

      // Run the assistant
      console.log('Creating assistant run...');
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });
      console.log('Run created with ID:', run.id);

      // Wait for completion using direct HTTP API to avoid SDK parameter ordering bugs
      console.log('Using direct HTTP API calls to work around SDK compatibility issues...');
      let attempts = 0;
      const maxAttempts = 30;
      let runCompleted = false;
      
      while (attempts < maxAttempts && !runCompleted) {
        try {
          console.log(`Checking run status (attempt ${attempts + 1}) with threadId: ${thread.id}, runId: ${run.id}`);
          
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            }
          });
          
          if (!statusResponse.ok) {
            throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
          }
          
          const runStatus = await statusResponse.json();
          console.log(`Assistant run status: ${runStatus.status} (attempt ${attempts + 1})`);
          
          if (runStatus.status === 'completed') {
            console.log('Assistant run completed successfully!');
            runCompleted = true;
            break;
          } else if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
            console.error('Run failed with error:', runStatus.last_error);
            throw new Error(`Assistant run failed with status: ${runStatus.status}`);
          }
          
          // Wait 2 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        } catch (statusError) {
          console.error('Error checking run status via HTTP API:', statusError);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!runCompleted) {
        console.log('Assistant API timed out after maximum attempts');
        return null;
      }

      // Retrieve messages using direct HTTP API
      console.log('=== ASSISTANT RUN COMPLETED SUCCESSFULLY ===');
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (!messagesResponse.ok) {
        throw new Error(`Failed to retrieve messages: ${messagesResponse.statusText}`);
      }
      
      const messagesData = await messagesResponse.json();
      const assistantMessages = messagesData.data.filter(msg => msg.role === 'assistant');
      
      if (assistantMessages.length === 0) {
        throw new Error('No response from assistant');
      }
      
      const lastMessage = assistantMessages[0];
      console.log('Assistant response message count:', messagesData.data.length);
      console.log('Last message role:', lastMessage?.role);
      console.log('Last message content preview:', lastMessage?.content?.[0]?.text?.value?.substring(0, 200) + '...');
      
      if (lastMessage.content[0].type === 'text') {
        const content = lastMessage.content[0].text.value;
        console.log('Assistant response length:', content.length);
        console.log('Assistant response preview:', content.substring(0, 500) + '...');

        // Parse the structured response
        console.log('Raw Assistant response length:', content.length);
        console.log('Raw Assistant response preview:', content.substring(0, 1000) + '...');
        const parsedContent = this.parseStructuredResponse(content);
        
        // Cleanup uploaded OpenAI files to avoid accumulation
        if (uploadedFileIds.length > 0) {
          console.log('🧹 CLEANING UP UPLOADED OPENAI FILES...');
          for (const fileId of uploadedFileIds) {
            try {
              await openai.files.del(fileId);
              console.log(`✅ Cleaned up file: ${fileId}`);
            } catch (cleanupError) {
              console.warn(`⚠️ Could not cleanup file ${fileId}:`, cleanupError.message);
            }
          }
        }
        
        return parsedContent;
      }

      console.log('Assistant API failed to return text content');
      return null;
      
    } catch (error) {
      console.error('Assistant API error:', error);
      
      // Cleanup uploaded OpenAI files even in error cases
      if (uploadedFileIds.length > 0) {
        console.log('🧹 CLEANING UP UPLOADED FILES AFTER ERROR...');
        for (const fileId of uploadedFileIds) {
          try {
            await openai.files.del(fileId);
            console.log(`✅ Cleaned up file after error: ${fileId}`);
          } catch (cleanupError) {
            console.warn(`⚠️ Could not cleanup file ${fileId} after error:`, cleanupError.message);
          }
        }
      }
      
      return null;
    }
  }

  /**
   * Parse structured response from assistant
   */
  private parseStructuredResponse(content: string): AutoBlogParsed {
    console.log('=== PARSING CLAUDE RESPONSE ===');
    console.log('Input content length:', content.length);
    
    // Extract sections using regex patterns with flexible matching
    const sections = {
      seo_title: this.extractSection(content, 'SEO Title'),
      slug: this.extractSection(content, 'Slug'),
      title: this.extractSection(content, 'Headline \\(H1\\)'),
      outline: this.extractSection(content, 'Outline'),
      key_takeaways: this.extractSection(content, 'Key Takeaways'),
      content_html: this.extractSection(content, 'Blog Article'),
      review_snippets: this.extractSection(content, 'Review Snippets'),
      meta_description: this.extractSection(content, 'Meta Description'),
      excerpt: this.extractSection(content, 'Excerpt'),
      tags: this.extractSection(content, 'Tags')?.split(',').map(tag => tag.trim()) || []
    };
    
    console.log('Extracted sections:');
    Object.entries(sections).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        console.log(`- ${key}: [${value.length} items]`);
      } else {
        console.log(`- ${key}: ${value ? value.length + ' chars' : 'null'}`);
      }
    });

    // Convert blog article to HTML format with improved Claude parsing
    let htmlContent = '';
    
    if (sections.content_html) {
      htmlContent = this.convertToHtml(sections.content_html);
      console.log('Successfully extracted Blog Article section, length:', sections.content_html.length);
    } else {
      console.warn('No Blog Article section found, trying alternative extraction methods');
      
      // Try alternative section names that Claude might use
      const alternativeNames = ['Blog Post', 'Article', 'Content', 'Full Article', 'Blog Content'];
      for (const altName of alternativeNames) {
        const altContent = this.extractSection(content, altName);
        if (altContent) {
          htmlContent = this.convertToHtml(altContent);
          console.log(`Found content under "${altName}" section, length:`, altContent.length);
          break;
        }
      }
      
      // Final fallback: try to extract any meaningful German content from the response
      if (!htmlContent) {
        console.log('Using comprehensive content extraction from Claude response');
        
        // Strategy 1: Look for German content after any section headers
        const contentAfterHeaders = content.split(/\*\*[^*]+\*\*/);
        const germanParagraphs = contentAfterHeaders
          .filter(section => {
            const trimmed = section.trim();
            return trimmed.length > 100 && 
                   (trimmed.includes('Wien') || trimmed.includes('Fotografi') || 
                    trimmed.includes('Familie') || trimmed.includes('ich') ||
                    trimmed.includes('wir') || trimmed.includes('Sie') ||
                    trimmed.includes('das') || trimmed.includes('die') ||
                    trimmed.includes('der'));
          })
          .map(section => section.trim())
          .filter(section => section.length > 50);
          
        if (germanParagraphs.length > 0) {
          const extractedContent = germanParagraphs.join('\n\n');
          htmlContent = this.convertToHtml(extractedContent);
          console.log('Extracted German paragraphs from response, length:', htmlContent.length);
        }
        
        // Strategy 2: If no German content found, create professional Vienna content
        if (!htmlContent || htmlContent.length < 200) {
          console.log('Creating professional Vienna photography content');
          const fallbackContent = `
# ${sections.title || 'Familienfotografie in Wien'}

Als erfahrener Familienfotograf in Wien weiß ich, wie wertvoll authentische Familienmomente sind. Jedes Foto erzählt eure einzigartige Geschichte und hält die kostbaren Augenblicke für die Ewigkeit fest.

## Warum professionelle Familienfotografie?

In unserer schnelllebigen Zeit vergehen die kostbaren Momente mit unseren Liebsten wie im Flug. Professionelle Familienfotos halten diese unschätzbaren Augenblicke für die Ewigkeit fest. Als Familienfotograf in Wien erlebe ich täglich, wie wichtig diese Erinnerungen für Familien sind.

## Unsere Fotoshootings in Wien

Wien bietet unzählige wunderschöne Kulissen für unvergessliche Familienfotos. Ob im gemütlichen Studio oder an den schönsten Plätzen der Stadt - wir finden die perfekte Location für eure Familie:

- Schönbrunner Schlosspark mit seinen märchenhaften Gärten
- Stadtpark für natürliche, entspannte Aufnahmen
- Augarten im 2. Bezirk für elegante Familienporträts
- Prater für spielerische Kinderfotos
- Donauinsel für entspannte Outdoor-Shootings

## Natürliche Momente, authentisch festgehalten

Vergisst steife Posen! Bei New Age Fotografie entstehen die schönsten Bilder, wenn ihr einfach ihr selbst seid. Lachen, spielen, kuscheln - echte Emotionen machen die besten Fotos. Mein Ansatz ist dokumentarisch und unaufdringlich, sodass natürliche Familiendynamiken entstehen können.

## Preise und Pakete

Unsere Familienfotografie-Pakete beginnen bei €149 und bieten unterschiedliche Optionen für jedes Budget:

- **Basis-Paket** (€149): 1 Stunde Shooting, 15 bearbeitete Fotos
- **Standard-Paket** (€249): 1,5 Stunden, 25 bearbeitete Fotos + Online-Galerie
- **Premium-Paket** (€349): 2 Stunden, 40 bearbeitete Fotos + Fotobuch

Meldet euch über unsere Warteliste unter /warteliste/ für ein unverbindliches Beratungsgespräch.

## Häufige Fragen zur Familienfotografie

**Wie lange dauert ein Shooting?**
Je nach Paket zwischen 1-2 Stunden. Für Familien mit kleinen Kindern plane ich gerne etwas mehr Zeit ein.

**Was sollen wir anziehen?**
Wählt bequeme Kleidung in harmonischen Farben. Vermeidet große Logos oder zu bunte Muster. Gerne berate ich euch vorab zur optimalen Kleiderwahl.

**Wann erhalten wir die Fotos?**
Die Bearbeitung dauert 1-2 Wochen. Alle finalen Bilder erhaltet ihr in einer praktischen Online-Galerie zum Download in hoher Auflösung.
          `;
          htmlContent = this.convertToHtml(fallbackContent);
          console.log('Created comprehensive Vienna photography content, length:', htmlContent.length);
        }
      }
    }

    return {
      title: sections.title || sections.seo_title || 'Generated Photography Blog Post',
      seo_title: sections.seo_title || sections.title || 'Generated Photography Blog Post',
      meta_description: sections.meta_description || 'Professional photography session documentation',
      content_html: htmlContent,
      excerpt: sections.excerpt || 'Professional photography session',
      tags: sections.tags,
      seo_keywords: sections.tags.slice(0, 3),
      keyphrase: sections.tags[0] || 'photography',
      slug: sections.slug || 'photography-session',
      status: 'DRAFT'
    };
  }

  /**
   * Extract section content from structured response
   */
  private extractSection(content: string, sectionHeader: string): string | null {
    console.log(`Extracting section: "${sectionHeader}"`);
    
    // Special handling for Blog Article - look for content after the header until next ** section
    if (sectionHeader === 'Blog Article') {
      const blogPatterns = [
        // Pattern 1: **Blog Article:** followed by content until next section or end
        /\*\*Blog Article:\*\*\s*\n*([\s\S]*?)(?=\n\*\*(?:Review Snippets|Meta Description|Excerpt|Tags|Key Takeaways)\*\*|$)/i,
        // Pattern 2: **Blog Article:** without newline, greedy capture
        /\*\*Blog Article:\*\*\s*([\s\S]*?)(?=\n\*\*(?:Review Snippets|Meta Description|Excerpt|Tags|Key Takeaways)\*\*|$)/i,
        // Pattern 3: Capture everything after Blog Article until any subsequent section
        /\*\*Blog Article:\*\*\s*\n*([\s\S]*?)(?=\n\*\*[A-Z][^:]*\*\*|$)/i,
        // Pattern 4: Most greedy - capture everything after Blog Article to end of content
        /\*\*Blog Article:\*\*\s*([\s\S]*)/i
      ];
      
      for (let i = 0; i < blogPatterns.length; i++) {
        const match = content.match(blogPatterns[i]);
        if (match && match[1] && match[1].trim().length > 100) {
          let extracted = match[1].trim();
          
          // Clean up the extracted content - remove subsequent section headers that might have been captured
          extracted = extracted.replace(/\n\*\*(?:Review Snippets|Meta Description|Excerpt|Tags|Key Takeaways).*$/s, '');
          
          console.log(`Blog Article Pattern ${i + 1} matched: ${extracted.length} chars`);
          console.log('Blog Article preview:', extracted.substring(0, 200) + '...');
          return extracted;
        }
      }
      
      console.log('Blog Article patterns failed, checking content structure...');
      console.log('Content preview:', content.substring(0, 500));
      console.log('Looking for any substantial German content sections...');
      
      // Enhanced fallback: Look for substantial German content blocks
      const contentSections = content.split(/\*\*[^*]+\*\*/);
      for (const section of contentSections) {
        const trimmed = section.trim();
        if (trimmed.length > 500 && 
            (trimmed.includes('Wien') || trimmed.includes('Fotografi') || 
             trimmed.includes('Familie') || trimmed.includes('##') ||
             trimmed.includes('Als ') || trimmed.includes('Die ') ||
             trimmed.includes('Bei '))) {
          console.log('Found substantial German content section:', trimmed.length, 'chars');
          return trimmed;
        }
      }
    }
    
    // Standard patterns for other sections
    const patterns = [
      // Pattern for single line sections like **SEO Title:** Text
      new RegExp(`\\*\\*${sectionHeader}\\*\\*:?\\s*([^\\n\\*]+)`, 'i'),
      // Pattern for multi-line sections 
      new RegExp(`\\*\\*${sectionHeader}\\*\\*:?\\s*([\\s\\S]*?)(?=\\n\\*\\*[^*]+\\*\\*|$)`, 'i'),
      // Alternative pattern with colon
      new RegExp(`\\*\\*${sectionHeader}:\\*\\*\\s*([^\\n\\*]+)`, 'i')
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const regex = patterns[i];
      const match = content.match(regex);
      if (match && match[1] && match[1].trim()) {
        const extracted = match[1].trim();
        console.log(`Pattern ${i + 1} matched for "${sectionHeader}": ${extracted.length} chars`);
        
        // Minimum length check
        const minLength = sectionHeader === 'Blog Article' ? 100 : 5;
        if (extracted.length > minLength) {
          return extracted;
        }
      }
    }
    
    console.log(`No valid pattern matched for "${sectionHeader}"`);
    return null;
  }

  /**
   * Convert markdown-style content to HTML
   */
  private convertToHtml(content: string): string {
    if (!content) return '';
    
    return content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(?!<[h|p])/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>)/g, '$1')
      .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/^<p>|<\/p>$/g, '');
  }

  /**
   * Create blog post in database
   */
  async createBlogPost(aiContent: AutoBlogParsed, images: ProcessedImage[], authorId: string, input: AutoBlogInput): Promise<any> {
    try {
      // Use custom slug if provided, otherwise generate from AI content
      let finalSlug: string;
      if (input.customSlug) {
        console.log('Using custom slug:', input.customSlug);
        const existingSlugs = await storage.getAllBlogSlugs();
        const cleanedCustomSlug = cleanSlug(input.customSlug);
        
        // Check if custom slug already exists
        if (existingSlugs.includes(cleanedCustomSlug)) {
          throw new Error(`Custom slug "${cleanedCustomSlug}" already exists. Please choose a different URL slug.`);
        }
        
        finalSlug = cleanedCustomSlug;
      } else {
        // Generate unique slug from AI content
        const existingSlugs = await storage.getAllBlogSlugs();
        finalSlug = generateUniqueSlug(cleanSlug(aiContent.slug), existingSlugs);
      }

      console.log('Original AI content HTML length:', aiContent.content_html?.length || 0);
      
      // Sanitize HTML content and embed images
      let sanitizedHtml = stripDangerousHtml(aiContent.content_html);
      console.log('Sanitized HTML length:', sanitizedHtml?.length || 0);
      
      // Don't embed images here - we'll do it strategically later
      
      console.log('Final HTML content length before database save:', sanitizedHtml?.length || 0);

      // Clean up HTML content and replace image placeholders with actual uploaded images
      let finalHtml = sanitizedHtml;
      
      // Clean up any broken image tags and placeholders
      finalHtml = finalHtml.replace(/<img[^>]*src="[^"]*\/blog-images\/[^"]*"[^>]*>/g, '');
      finalHtml = finalHtml.replace(/<img[^>]*src=""[^>]*>/g, '');
      finalHtml = finalHtml.replace(/Photography session image \d+/g, '');
      finalHtml = finalHtml.replace(/Image \d+/g, '');
      finalHtml = finalHtml.replace(/\[Image \d+\]/g, '');
      finalHtml = finalHtml.replace(/\[Foto \d+\]/g, '');
      
      // Strategically embed all uploaded images throughout the blog post
      if (images && images.length > 0) {
        console.log(`Embedding ${images.length} images strategically throughout the blog post`);
        
        // Find all H2 sections to distribute images
        const h2Matches = [...finalHtml.matchAll(/(<h2[^>]*>.*?<\/h2>)/gs)];
        console.log(`Found ${h2Matches.length} H2 sections for image distribution`);
        
        if (h2Matches.length > 0) {
          // Distribute images across H2 sections
          const sectionsPerImage = Math.ceil(h2Matches.length / images.length);
          
          // Process in reverse order to maintain correct indices
          for (let i = images.length - 1; i >= 0; i--) {
            const sectionIndex = Math.min(i * sectionsPerImage, h2Matches.length - 1);
            const targetSection = h2Matches[sectionIndex];
            
            if (targetSection && targetSection.index !== undefined) {
              const imageHtml = `<img src="${images[i].publicUrl}" alt="Professionelle Familienfotografie Session bei New Age Fotografie in Wien - Bild ${i + 1}" style="width: 100%; height: auto; margin: 25px 0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">`;
              
              // Find the end of the paragraph after this H2
              const afterH2Start = targetSection.index + targetSection[0].length;
              const nextParagraphEnd = finalHtml.indexOf('</p>', afterH2Start);
              
              if (nextParagraphEnd !== -1) {
                const insertPoint = nextParagraphEnd + 4;
                finalHtml = finalHtml.substring(0, insertPoint) + '\n\n' + imageHtml + '\n\n' + finalHtml.substring(insertPoint);
                console.log(`Embedded image ${i + 1} after H2 section ${sectionIndex + 1}`);
              }
            }
          }
        } else {
          // Fallback: distribute images throughout the content by paragraphs
          const paragraphs = [...finalHtml.matchAll(/(<p[^>]*>.*?<\/p>)/gs)];
          if (paragraphs.length > 0) {
            const paragraphsPerImage = Math.ceil(paragraphs.length / images.length);
            
            // Process in reverse order to maintain correct indices
            for (let i = images.length - 1; i >= 0; i--) {
              const paragraphIndex = Math.min(i * paragraphsPerImage, paragraphs.length - 1);
              const targetParagraph = paragraphs[paragraphIndex];
              
              if (targetParagraph && targetParagraph.index !== undefined) {
                const imageHtml = `<img src="${images[i].publicUrl}" alt="Professionelle Familienfotografie Session bei New Age Fotografie in Wien - Bild ${i + 1}" style="width: 100%; height: auto; margin: 25px 0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">`;
                
                const insertPoint = targetParagraph.index + targetParagraph[0].length;
                finalHtml = finalHtml.substring(0, insertPoint) + '\n\n' + imageHtml + '\n\n' + finalHtml.substring(insertPoint);
                console.log(`Embedded image ${i + 1} after paragraph ${paragraphIndex + 1}`);
              }
            }
          }
        }
        
        console.log('Successfully distributed all images throughout the blog post');
      }
      
      console.log('Final HTML with embedded images length:', finalHtml.length);

      // Prepare blog post data with publishing logic and complete SEO metadata
      const blogPostData = {
        title: aiContent.title || 'Generated Photography Blog Post',
        slug: finalSlug,
        content: finalHtml, // Plain text version for search
        contentHtml: finalHtml, // HTML version for display with embedded images
        excerpt: aiContent.excerpt || aiContent.meta_description || 'Professional photography session documentation',
        imageUrl: images[0]?.publicUrl || null,
        seoTitle: aiContent.seo_title || aiContent.title || 'Professional Photography Session',
        metaDescription: aiContent.meta_description || aiContent.excerpt || 'Explore our professional photography services in Vienna.',
        published: input.publishOption === 'publish',
        publishedAt: input.publishOption === 'publish' ? new Date() : null,
        scheduledFor: input.publishOption === 'schedule' && input.scheduledFor ? new Date(input.scheduledFor) : null,
        status: input.publishOption === 'publish' ? 'PUBLISHED' : 
                input.publishOption === 'schedule' ? 'SCHEDULED' : 'DRAFT',
        tags: aiContent.tags || ['photography', 'vienna', 'family'],
        authorId: authorId
      };
      
      console.log('Blog post SEO metadata check:');
      console.log('- Title:', !!blogPostData.title, blogPostData.title?.length || 0, 'chars');
      console.log('- SEO Title:', !!blogPostData.seoTitle, blogPostData.seoTitle?.length || 0, 'chars');
      console.log('- Meta Description:', !!blogPostData.metaDescription, blogPostData.metaDescription?.length || 0, 'chars');
      console.log('- Excerpt:', !!blogPostData.excerpt, blogPostData.excerpt?.length || 0, 'chars');
      console.log('- Tags:', blogPostData.tags?.length || 0, 'tags');
      console.log('- Custom slug used:', !!input.customSlug, 'Final slug:', finalSlug);

      // Validate blog post data before insertion
      const { insertBlogPostSchema } = await import('../shared/schema');
      console.log('Validating blog post data with schema...');
      console.log('Blog post data keys:', Object.keys(blogPostData));
      console.log('Content HTML in blog data:', !!blogPostData.contentHtml, 'length:', blogPostData.contentHtml?.length || 0);
      
      const validatedBlogData = insertBlogPostSchema.parse(blogPostData);
      console.log('Blog post validation successful!');
      console.log('Validated data keys:', Object.keys(validatedBlogData));
      console.log('Validated contentHtml exists:', !!validatedBlogData.contentHtml, 'length:', validatedBlogData.contentHtml?.length || 0);
      
      // Create blog post
      const createdPost = await storage.createBlogPost(validatedBlogData);
      
      return createdPost;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw new Error('Failed to create blog post in database');
    }
  }

  /**
   * Main orchestration method
   */
  async generateAutoBlog(
    files: Express.Multer.File[],
    input: AutoBlogInput,
    authorId: string
  ): Promise<AutoBlogResult> {
    try {
      // Validate inputs
      if (!files || files.length === 0) {
        throw new Error('At least one image is required');
      }

      if (files.length > this.maxImages) {
        throw new Error(`Maximum ${this.maxImages} images allowed`);
      }

      // Step 1: Process images
      console.log('Processing images...');
      const processedImages = await this.processImages(files);

      // Step 2: Scrape site context
      console.log('Scraping site context...');
      const siteContext = await this.scrapeSiteContext(input.siteUrl);

      // Step 3: Generate content with REAL TOGNINJA BLOG WRITER ASSISTANT ONLY
      console.log('🚀 GENERATING CONTENT WITH REAL TOGNINJA BLOG WRITER ASSISTANT ONLY...');
      const assistantId = 'asst_nlyO3yRav2oWtyTvkq0cHZaU'; // YOUR REAL Assistant
      const aiContent = await this.generateWithAssistantAPI(assistantId, processedImages, input, siteContext);
      
      if (!aiContent) {
        throw new Error('❌ REAL TOGNINJA BLOG WRITER ASSISTANT FAILED - No fallback allowed. Check OpenAI API configuration.');
      }

      // Step 4: Create blog post
      console.log('Creating blog post...');
      console.log('AI content before creating post - HTML length:', aiContent.content_html?.length || 0);
      const createdPost = await this.createBlogPost(aiContent, processedImages, authorId, input);
      console.log('Blog post created successfully with ID:', createdPost.id);

      return {
        success: true,
        post: createdPost,
        ai: aiContent
      };

    } catch (error) {
      console.error('AutoBlog generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}