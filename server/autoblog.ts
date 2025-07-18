import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import OpenAI from 'openai';
import FormData from 'form-data';
import { autoBlogSchema, type AutoBlogParsed, type AutoBlogInput } from './autoblog-schema';
import { buildAutoBlogPrompt } from './autoblog-prompt';
import { stripDangerousHtml, generateUniqueSlug, cleanSlug } from './util-strip-html';
import { storage } from './storage';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
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
   * Generate blog content using OpenAI Assistant
   */
  async generateBlogContent(
    images: ProcessedImage[], 
    input: AutoBlogInput, 
    siteContext: string
  ): Promise<AutoBlogParsed> {
    const assistantId = 'asst_nlyO3yRav2oWtyTvkq0cHZaU'; // AutoBlog Assistant
    
    // Build user message with context
    const userMessage = `Business Context: ${siteContext}
Session Details: ${input.userPrompt || 'Professional photography session documentation'}
Language: ${input.language}
Generate blog post for uploaded photography session images.`;

    // Prepare image content with public URLs
    const imageContent = images.map((img, index) => {
      console.log(`Processing image ${index + 1}: ${img.publicUrl}`);
      return {
        type: "image_url" as const,
        image_url: {
          url: img.publicUrl,
          detail: "high"
        }
      };
    });

    try {
      console.log('Attempting to use OpenAI Assistant API first...');
      console.log('Assistant ID:', assistantId);
      console.log('Image count:', images.length);
      console.log('User context:', userMessage);

      // Try OpenAI Assistant API first
      try {
        console.log('=== ATTEMPTING ASSISTANT API ===');
        console.log('Assistant ID:', assistantId);
        console.log('Number of images:', images.length);
        console.log('Image URLs:', images.map(img => img.publicUrl));
        
        const assistantResult = await this.generateWithAssistantAPI(assistantId, images, input, siteContext);
        
        if (assistantResult) {
          console.log('=== ASSISTANT API SUCCESS ===');
          console.log('Generated content length:', assistantResult.content?.length || 0);
          console.log('Title generated:', assistantResult.seoTitle || 'No title');
          return assistantResult;
        } else {
          console.log('=== ASSISTANT API RETURNED NULL ===');
        }
      } catch (assistantError) {
        console.error('=== ASSISTANT API FAILED ===');
        console.error('Assistant API error details:', assistantError);
        console.error('Error stack:', assistantError.stack);
        console.log('Falling back to Chat Completions API...');
      }

      // Chat Completions API with sophisticated German photography prompts
      console.log('=== USING CHAT COMPLETIONS API ===');
      console.log('This uses your sophisticated German photography prompts for high-quality content');
      
      // Convert images to base64 for Chat Completions API
      const imageContents = [];
      for (let i = 0; i < images.length; i++) {
        console.log(`Processing image ${i + 1}/${images.length}...`);
        
        // Convert buffer to base64
        const base64Image = images[i].buffer.toString('base64');
        imageContents.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
            detail: "high"
          }
        });
      }
      
      console.log('Successfully processed', imageContents.length, 'images for analysis');

      // Your sophisticated German photography prompt for highest quality content
      const sophisticatedPrompt = `Humanized, Mentor-Tone, SEO-Ready, Undetectably AI

🧠 Context:
You're my content-writing sidekick for New Age Fotografie, a Vienna-based family and newborn photography studio. We speak directly to clients like real humans. You write like I talk. This is not a blog post. It's a one-to-one convo — with substance, soul, and structure.

WICHTIG: Schreibe AUSSCHLIESSLICH auf Deutsch. Alle Inhalte müssen auf Deutsch sein.

Tone = founder + mentor + experience-led
Your default voice combines:

🎯 Sabri Suby (direkter Verkaufstext)
📸 Echter Fotobusiness-Besitzer (nicht KI)  
👨‍🏫 Mentor, der Dinge klar erklärt
💬 Persönlicher, erster-Person-Ton mit authentischen Unperfektion

🔍 You Must Ensure:
✅ Content passes AI detection (Originality.ai, GPTZero) by:
- Varying sentence length + rhythm
- Using idioms, human anecdotes, casual fragments
- Avoiding robotic transitions or overstructured tone
- Sprinkling natural glitches: "gonna", "lass uns ehrlich sein", "ja", "fair enough"
- Using first-person perspective (founder voice)
- Writing as if it was manually written over 3 days, not generated in 30 seconds

💡 Your Task:
Create a full German content package for Vienna photography clients, structured for SEO and real-human storytelling:

♻️ YOAST SEO COMPLIANCE (Built-in):
Keyphrase: Familienfotograf Wien / Neugeborenenfotos Wien / Familienfotos Wien
Include it in: SEO title, Slug, H1, First paragraph, At least one H2, Twice minimum in body, Meta description

Meta description: 120–156 chars
Flesch Reading Ease > 60
Passive voice < 10%
Long sentences < 25%
Transition words > 30%
Paragraphs < 150 words
Internal + external links to /warteliste/

🚫 NEVER USE marketing jargon:
"Step into," "unleash," "embrace your journey," "revolutionär," "transformativ," etc.
Use natural, specific, grounded German language.

Business Context: ${siteContext}
Session Details: ${input.userPrompt || 'Professional photography session documentation'}
Language: German (de)

Analyze the uploaded images carefully and create comprehensive German content about this photography session. Describe authentic details from the images (clothing colors, setting, mood, emotions, Vienna location details, etc.) and write in authentic Wiener German for the local market.

✅ Output Format (Exact Structure):
**SEO Title:** [German SEO title with Vienna/photography keywords]
**Slug:** [url-friendly-slug]
**Headline (H1):** [Catchy German headline with quotes or emotional hook]
**Outline:** [Brief section outline showing H2 structure]
**Key Takeaways:** [5-point table with takeaway and "Warum es wichtig ist" explanation]
**Blog Article:** [Full German blog with H1 and 6-8 H2 sections, authentic storytelling, specific image details, customer reviews/testimonials, pricing hints, FAQs - NO <img> tags]
**Review Snippets:** [3 authentic customer review quotes with names]
**Meta Description:** [120-156 character German meta description]
**Excerpt:** [Brief German preview text]
**Tags:** [relevant German photography tags]

WICHTIG: 
- Analysiere die Bilder im Detail (Kleidung, Setting, Emotionen, Posen)
- Verwende spezifische Details aus den Bildern in deinem Content
- Schreibe wie ein echter Wiener Fotograf, nicht wie KI
- Eingebaute interne Links zu /warteliste/
- Pro-Tipps für Outfit/Posen einbauen
- Echte Wiener Referenzen (Bezirke, Locations)
- Preise erwähnen (€149+ Pakete)
- Kundenstimmen einbauen (5-Sterne-Reviews)`;

      const messages = [
        {
          role: "system",
          content: "You are a professional photography content writer. Analyze the uploaded images and create structured content using the exact format provided."
        },
        {
          role: "user", 
          content: [
            {
              type: "text",
              text: sophisticatedPrompt
            },
            ...imageContents
          ]
        }
      ];

      // Make API call with sophisticated German photography prompts
      console.log('Sending', imageContents.length, 'images to Chat Completions API');
      console.log('Using your sophisticated German prompt with:', 
                  sophisticatedPrompt.includes('Wien') ? '✓ Vienna context' : '✗ No Vienna',
                  sophisticatedPrompt.includes('Deutsch') ? '✓ German language' : '✗ No German',
                  sophisticatedPrompt.includes('New Age Fotografie') ? '✓ Studio branding' : '✗ No branding',
                  sophisticatedPrompt.includes('Sabri Suby') ? '✓ Mentor tone' : '✗ No mentor tone',
                  sophisticatedPrompt.includes('€149') ? '✓ Pricing context' : '✗ No pricing');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Latest model that supports vision
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log('Chat Completions response length:', content.length);
      console.log('Chat Completions response preview:', content.substring(0, 500) + '...');

      // Parse the structured markdown response
      console.log('RAW OpenAI Response Preview:', content.substring(0, 1000) + '...');
      const parsedContent = this.parseStructuredResponse(content);
      console.log('Parsed structured content keys:', Object.keys(parsedContent));
      console.log('Content HTML exists:', !!parsedContent.content_html);
      console.log('Content HTML length:', parsedContent.content_html?.length || 0);
      console.log('Content HTML preview:', parsedContent.content_html?.substring(0, 200) + '...');

      // Override status based on publishing option
      if (input.publishOption === 'publish') {
        parsedContent.status = 'PUBLISHED';
      } else if (input.publishOption === 'schedule') {
        parsedContent.status = 'SCHEDULED';
      } else {
        parsedContent.status = 'DRAFT';
      }

      return parsedContent;
    } catch (error) {
      console.error('Error generating blog content with Chat Completions:', error);
      throw new Error('Failed to generate blog content');
    }
  }

  /**
   * Generate content using OpenAI Assistant API
   */
  async generateWithAssistantAPI(
    assistantId: string, 
    images: ProcessedImage[], 
    input: AutoBlogInput, 
    siteContext: string
  ): Promise<AutoBlogParsed | null> {
    try {
      console.log('Attempting OpenAI Assistant API...');
      
      // Enhanced prompt to match your sophisticated test output
      const userMessage = `Du bist mein Content-Schreibpartner für New Age Fotografie, ein professionelles Fotostudio in Wien, das sich auf Familien-, Neugeborenen- und Porträtfotografie spezialisiert hat.

WICHTIG: Schreibe AUSSCHLIESSLICH auf DEUTSCH. Alle Inhalte müssen vollständig in deutscher Sprache sein.

Business Context: ${siteContext}
Session Details: ${input.userPrompt || 'Professionelle Fotosession Dokumentation'}
Language: ${input.language || 'de'}

SCHREIBSTIL = Humanisiert, Mentor-Ton, SEO-bereit, unentdeckbar KI
Kontext: Du bist mein Content-Schreibpartner. Ich brauche authentische, spezifische, bodenständige deutsche Inhalte.

Ton = Gründer + Mentor + Erfahrung-basiert
Deine Stimme kombiniert:
- Sabri Suby (direkter Verkaufstext)
- Echter Fotobusiness-Besitzer (nicht KI)
- Mentor, der Dinge klar erklärt
- Persönlicher, erster-Person-Ton mit authentischen Unperfektion

YOAST SEO-konform:
- H1 + 6-8 H2-Abschnitte (300-500 Wörter pro Abschnitt)
- Natürliche Keyword-Platzierung 
- Variierende Satzlängen (kurz, mittel, lang)
- Echte Idiome, Erste-Person-Perspektive
- Authentische kleine "Unperfektion"

Erstelle ein vollständiges Content-Paket mit dieser EXAKTEN Struktur:
**SEO Title:** [German SEO title with Vienna/photography keywords]
**Slug:** [url-friendly-slug]
**Headline (H1):** [Catchy German headline with quotes or emotional hook]
**Outline:** [Brief section outline showing H2 structure]
**Key Takeaways:** [5-point table with takeaway and "Warum es wichtig ist" explanation]
**Blog Article:** [Full German blog with H1 and 6-8 H2 sections, authentic storytelling, specific image details, customer reviews/testimonials, pricing hints, FAQs]
**Review Snippets:** [3 authentic customer review quotes with names]
**Meta Description:** [120-156 character German meta description]
**Excerpt:** [Brief German preview text]
**Tags:** [relevant German photography tags]

WICHTIG: 
- Analysiere die Bilder im Detail (Kleidung, Setting, Emotionen, Posen)
- Verwende spezifische Details aus den Bildern in deinem Content
- Schreibe wie ein echter Wiener Fotograf, nicht wie KI
- Eingebaute interne Links zu /warteliste/
- Pro-Tipps für Outfit/Posen einbauen
- Echte Wiener Referenzen (Bezirke, Locations)
- Preise erwähnen (€149+ Pakete)
- Kundenstimmen einbauen (5-Sterne-Reviews)`;

      // Create thread
      const thread = await openai.beta.threads.create();
      
      // Create message content with text and image URLs
      const messageContent = [
        {
          type: "text",
          text: userMessage
        }
      ];
      
      // Add images as URLs for the Assistant to analyze
      if (images.length > 0) {
        const imageDescriptions = images.map((img, index) => 
          `Bild ${index + 1}: ${img.publicUrl}`
        ).join('\n');
        
        messageContent.push({
          type: "text", 
          text: `\n\nBilder für die Analyse:\n${imageDescriptions}\n\nAnalysiere diese Bilder im Detail und erstelle authentischen Content basierend auf den tatsächlichen Details (Kleidung, Emotionen, Setting, etc.) die du in den Bildern siehst.`
        });
        
        // Add each image URL as image_url type
        images.forEach((img, index) => {
          messageContent.push({
            type: "image_url",
            image_url: {
              url: img.publicUrl,
              detail: "high"
            }
          });
        });
      }
      
      console.log(`Sending ${images.length} image URLs to Assistant API`);
      
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

      // Wait for completion
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30;
      
      console.log('Initial run status:', runStatus.status);
      
      while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
        console.log(`Waiting for completion... attempt ${attempts + 1}/${maxAttempts}, status: ${runStatus.status}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        attempts++;
      }
      
      console.log('Final run status:', runStatus.status);
      if (runStatus.status === 'failed') {
        console.error('Run failed with error:', runStatus.last_error);
      }

      if (runStatus.status === 'completed') {
        console.log('=== ASSISTANT RUN COMPLETED SUCCESSFULLY ===');
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];
        console.log('Assistant response message count:', messages.data.length);
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
          return parsedContent;
        }
      }

      console.log('Assistant API failed or timed out, status:', runStatus.status);
      return null;
      
    } catch (error) {
      console.error('Assistant API error:', error);
      return null;
    }
  }

  /**
   * Parse structured response from assistant
   */
  private parseStructuredResponse(content: string): AutoBlogParsed {
    // Extract sections using regex patterns
    const sections = {
      seo_title: this.extractSection(content, 'SEO Title:'),
      slug: this.extractSection(content, 'Slug:'),
      title: this.extractSection(content, 'Headline \\(H1\\):'),
      outline: this.extractSection(content, 'Outline:'),
      key_takeaways: this.extractSection(content, 'Key Takeaways:'),
      content_html: this.extractSection(content, 'Blog Article:'),
      review_snippets: this.extractSection(content, 'Review Snippets:'),
      meta_description: this.extractSection(content, 'Meta Description:'),
      excerpt: this.extractSection(content, 'Excerpt:'),
      tags: this.extractSection(content, 'Tags:')?.split(',').map(tag => tag.trim()) || []
    };

    // Convert blog article to HTML format
    const htmlContent = this.convertToHtml(sections.content_html || '');

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
    const regex = new RegExp(`\\*\\*${sectionHeader}\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[^*]+:\\*\\*|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
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

      // Step 3: Generate content with OpenAI
      console.log('Generating content with OpenAI...');
      const aiContent = await this.generateBlogContent(processedImages, input, siteContext);

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