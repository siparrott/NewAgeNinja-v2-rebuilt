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

    // Prepare image content for OpenAI vision
    const imageContent = images.map((img, index) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${img.buffer.toString('base64')}`
      }
    }));

    try {
      console.log('Using reliable Chat Completions API with vision analysis');
      console.log('Image count:', images.length);
      console.log('User context:', userMessage);

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

      // Create comprehensive prompt for image analysis and blog generation
      const systemPrompt = `Du bist ein erfahrener Fotografie-Content-Experte für New Age Fotografie in Wien.

🧠 Context:
Du schreibst authentische, persönliche Inhalte für New Age Fotografie - ein professionelles Fotostudio in Wien, das sich auf Familien-, Neugeborenen- und Porträtfotografie spezialisiert hat.

Tone = Gründer + Mentor + erfahrungsbasiert
Deine Stimme kombiniert:
🎯 Direkter, authentischer Verkaufsstil
📸 Echter Fotografie-Businessinhaber (nicht AI)
👨‍🏫 Mentor, der Dinge klar einem Kunden erklärt
💬 Persönlicher, first-person Ton mit leichter Imperfektion

🔍 Du musst sicherstellen:
✅ Content wirkt menschlich und authentisch durch:
- Variierende Satzlänge + Rhythmus
- Verwendung von Redewendungen, menschlichen Anekdoten
- Natürliche Glitches: "werden", "mal", "einfach", "wirklich"
- First-person Perspektive
- Schreibstil, als wäre es über 3 Tage manuell geschrieben

💡 Deine Aufgabe:
Erstelle ein vollständiges Content-Package, strukturiert für SEO und echtes menschliches Storytelling:

H1 (Hauptüberschrift)
6–8 H2s (jeweils 300–500 Wörter)
Key Takeaways
Vollständiger Blog-Artikel (informeller, persönlicher Ton)
Meta-Beschreibung
Excerpt

♻️ YOAST SEO COMPLIANCE (Built-in):
- Keyphrase in SEO-Titel, Slug, H1, erstem Absatz, mindestens einem H2, mindestens 2x im Text
- Meta-Beschreibung: 120–156 Zeichen
- Flesch Reading Ease > 60
- Passiv < 10%
- Lange Sätze < 25%
- Übergangswörter > 30%
- Absätze < 150 Wörter

🚫 NIEMALS VERWENDEN:
Marketing-Phrasen wie: "Tauchen Sie ein", "entfesseln", "revolutionär", "transformativ", etc.
Verwende natürliche, spezifische, bodenständige Sprache.

WICHTIG: Antworte NUR mit einem gültigen JSON-Objekt in diesem exakten Format:
{
  "title": "SEO-optimierter deutscher Titel",
  "seo_title": "SEO-optimierter Titel für Meta-Tags",
  "meta_description": "155-Zeichen Meta-Beschreibung mit Keywords",
  "content_html": "Vollständiger HTML Blog-Post Inhalt mit H1 und 6-8 H2-Abschnitten",
  "excerpt": "Kurze Zusammenfassung (150 Zeichen)",
  "tags": ["tag1", "tag2", "tag3"],
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "keyphrase": "Haupt-SEO-Keyphrase für YOAST",
  "slug": "url-freundlicher-slug"
}`;

      // Prepare messages with text and images
      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: [
            {
              type: "text",
              text: `${userMessage}\n\nAnalysiere die hochgeladenen Bilder sorgfältig und erstelle einen umfassenden, SEO-optimierten Blog-Post über diese Fotosession. Beschreibe authentische Details aus den Bildern (Kleidung, Setting, Stimmung, Emotionen, Location-Details, etc.) und erstelle strukturierten Content mit H1 und 6-8 H2-Abschnitten von jeweils 300-500 Wörtern. Verwende einen persönlichen, authentischen Ton als Fotograf und Studiobesitzer. Integriere natürliche Keywords und erstelle YOAST-kompatiblen SEO-Content für New Age Fotografie in Wien.`
            },
            ...imageContents
          ]
        }
      ];

      // Make API call with images
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Latest model that supports vision
        messages: messages,
        max_tokens: 3000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log('Chat Completions response length:', content.length);
      console.log('Chat Completions response preview:', content.substring(0, 500) + '...');

      // Parse and validate the JSON response
      const parsedContent = JSON.parse(content);
      console.log('Parsed content keys:', Object.keys(parsedContent));
      console.log('Content HTML length:', parsedContent.content_html?.length || 0);
      console.log('Content HTML preview:', parsedContent.content_html?.substring(0, 200) + '...');
      
      // Add debugging before validation
      console.log('About to validate with schema. Raw content_html exists:', !!parsedContent.content_html);
      console.log('Raw content_html type:', typeof parsedContent.content_html);
      
      const validatedContent = autoBlogSchema.parse(parsedContent);
      console.log('Validated content HTML length:', validatedContent.content_html?.length || 0);
      console.log('Validated content HTML preview:', validatedContent.content_html?.substring(0, 200) + '...');

      // Override status based on publishing option
      if (input.publishOption === 'publish') {
        validatedContent.status = 'PUBLISHED';
        validatedContent.publish_now = true;
      } else if (input.publishOption === 'schedule') {
        validatedContent.status = 'SCHEDULED';
        validatedContent.publish_now = false;
      } else {
        validatedContent.status = 'DRAFT';
        validatedContent.publish_now = false;
      }

      return validatedContent;
    } catch (error) {
      console.error('Error generating blog content with Chat Completions:', error);
      throw new Error('Failed to generate blog content');
    }
  }

  /**
   * Create blog post in database
   */
  async createBlogPost(aiContent: AutoBlogParsed, images: ProcessedImage[], authorId: string, input: AutoBlogInput): Promise<any> {
    try {
      // Get existing slugs to ensure uniqueness
      const existingSlugs = await storage.getAllBlogSlugs();
      const uniqueSlug = generateUniqueSlug(cleanSlug(aiContent.slug), existingSlugs);

      console.log('Original AI content HTML length:', aiContent.content_html?.length || 0);
      
      // Sanitize HTML content and embed images
      let sanitizedHtml = stripDangerousHtml(aiContent.content_html);
      console.log('Sanitized HTML length:', sanitizedHtml?.length || 0);
      
      // Add images to the blog content if they were uploaded
      if (images.length > 0) {
        const imageElements = images.map((img, index) => {
          const altText = aiContent.image_alts?.[index] || `Photography session image ${index + 1}`;
          return `<img src="${img.publicUrl}" alt="${altText}" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;" />`;
        }).join('\n');
        
        // Insert images after the first paragraph
        const firstParagraphEnd = sanitizedHtml.indexOf('</p>');
        if (firstParagraphEnd !== -1) {
          sanitizedHtml = sanitizedHtml.slice(0, firstParagraphEnd + 4) + 
                         '\n\n' + imageElements + '\n\n' + 
                         sanitizedHtml.slice(firstParagraphEnd + 4);
        } else {
          // If no paragraphs found, add images at the beginning
          sanitizedHtml = imageElements + '\n\n' + sanitizedHtml;
        }
      }
      
      console.log('Final HTML content length before database save:', sanitizedHtml?.length || 0);

      // Prepare blog post data with publishing logic
      const blogPostData = {
        title: aiContent.title,
        slug: uniqueSlug,
        content: sanitizedHtml, // Plain text version for search
        contentHtml: sanitizedHtml, // HTML version for display
        excerpt: aiContent.excerpt,
        imageUrl: images[0]?.publicUrl || null,
        seoTitle: aiContent.seo_title,
        metaDescription: aiContent.meta_description,
        published: input.publishOption === 'publish',
        publishedAt: input.publishOption === 'publish' ? new Date() : null,
        scheduledFor: input.publishOption === 'schedule' && input.scheduledFor ? new Date(input.scheduledFor) : null,
        status: input.publishOption === 'publish' ? 'PUBLISHED' : 
                input.publishOption === 'schedule' ? 'SCHEDULED' : 'DRAFT',
        tags: aiContent.tags || [],
        authorId: authorId,
      };

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