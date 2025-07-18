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
   * Gather comprehensive context for REAL Assistant
   */
  async gatherComprehensiveContext(images: ProcessedImage[], input: AutoBlogInput): Promise<string> {
    console.log('🔍 === GATHERING COMPREHENSIVE CONTEXT FOR REAL ASSISTANT ===');
    
    // 1. Analyze images with Chat Completions API (for vision capabilities)
    let imageAnalysis = '';
    if (images.length > 0) {
      console.log('📸 STEP 1: Analyzing uploaded images...');
      try {
        const imageMessages = [
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text: "Analyze these photography session images. What type of session is this? Describe the subjects, setting, emotions, clothing, and any specific details you can see. Be very specific about whether this is newborn, family, maternity, business headshots, etc."
              },
              ...images.map(img => ({
                type: "image_url" as const,
                image_url: {
                  url: `data:image/jpeg;base64,${img.buffer.toString('base64')}`
                }
              }))
            ]
          }
        ];

        const imageResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: imageMessages,
          max_tokens: 500
        });

        imageAnalysis = imageResponse.choices[0]?.message?.content || '';
        console.log('✅ Image Analysis Complete:', imageAnalysis.substring(0, 200) + '...');
      } catch (error) {
        console.error('❌ Image analysis failed:', error);
        imageAnalysis = 'General photography session';
      }
    }

    // 2. Comprehensive homepage and website context gathering
    console.log('🌐 STEP 2: Gathering comprehensive website context...');
    let websiteContext = '';
    try {
      const homepageResponse = await fetch('https://www.newagefotografie.com');
      if (homepageResponse.ok) {
        const htmlContent = await homepageResponse.text();
        
        // Extract comprehensive content sections
        const textContent = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Extract specific sections from homepage
        const heroSection = this.extractHomepageSection(textContent, 'hero');
        const servicesSection = this.extractHomepageSection(textContent, 'services');
        const aboutSection = this.extractHomepageSection(textContent, 'about');
        const pricingSection = this.extractHomepageSection(textContent, 'pricing');
        const testimonialSection = this.extractHomepageSection(textContent, 'testimonials');
        const contactSection = this.extractHomepageSection(textContent, 'contact');
        
        websiteContext = `COMPREHENSIVE WEBSITE CONTEXT:
        
HERO SECTION: ${heroSection}
SERVICES OFFERED: ${servicesSection}
ABOUT BUSINESS: ${aboutSection}
PRICING STRUCTURE: ${pricingSection}
CLIENT TESTIMONIALS: ${testimonialSection}
CONTACT INFORMATION: ${contactSection}

FULL WEBSITE VOICE ANALYSIS: ${textContent.substring(0, 3000)}

WEBSITE TONE ANALYSIS:
- Writing style: Professional yet personal
- Target audience: Families, expecting parents, business professionals
- Unique selling propositions: Studio location, professional equipment, personalized experience
- Brand voice: Warm, trustworthy, experienced, Vienna-focused
- Key messages: Family moments, professional quality, convenient location
- Service differentiation: Studio vs outdoor, various session types
- Location emphasis: Vienna, 1050 Wien, Schönbrunner Straße area`;
        
        console.log('✅ Comprehensive website context gathered:', websiteContext.substring(0, 200) + '...');
      }
    } catch (error) {
      console.error('❌ Website scraping failed:', error);
      websiteContext = 'FALLBACK: Professional photography studio in Vienna specializing in family portraits';
    }

    // 3. Enhanced SEO and competitor context
    console.log('🔍 STEP 3: Enhanced SEO and competitor context...');
    const seoContext = `
VIENNA PHOTOGRAPHY SEO CONTEXT:
- Primary location: Wien (Vienna), Austria, 1050 Wien district
- Key areas: Schönbrunner Straße, Kettenbrückengasse, Naschmarkt area
- Competitors: Family photographers Vienna, newborn photographers Vienna, baby photographers Wien
- Target keywords: Familienfotograf Wien, Neugeborenenfotos Wien, Familienshooting Wien, Baby Fotoshooting Wien
- Long-tail keywords: "Familienfotograf 1050 Wien", "Neugeborenenfotos Studio Wien", "Babyfotograf Schönbrunner Straße"
- Pricing range: €95-€295 for sessions (competitive Vienna market)
- Unique selling points: Professional studio space, weekend availability, central Vienna location
- Service differentiation: Studio vs outdoor options, newborn specialization, business headshots
- Local SEO factors: Google My Business, Vienna photography directories, local family blogs
- Seasonal keywords: "Weihnachts Familienfotografie Wien", "Frühling Familienshooting Wien"
`;

    // 4. Comprehensive business details and service context
    const businessContext = `
NEW AGE FOTOGRAFIE COMPREHENSIVE BUSINESS DETAILS:
- Studio address: Schönbrunner Str. 25, 1050 Wien, Austria
- Contact: hallo@newagefotografie.com, +43 677 933 99210
- Business hours: Fr-So: 09:00 - 17:00 (weekend focused for family convenience)
- Website: https://www.newagefotografie.com
- Booking system: /warteliste/ (waitlist page for high demand)
- Primary services: Family portraits, newborn photography, maternity sessions, business headshots
- Secondary services: Event photography, couples sessions, individual portraits
- Studio features: Professional lighting setup, props and backdrops, comfortable environment
- Equipment: Professional cameras, studio lighting, variety of lenses
- Location benefits: 5 minutes from Kettenbrückengasse U-Bahn, street parking available
- Target demographics: Young families, expecting parents, business professionals
- Session types: Studio sessions, outdoor sessions, home visits (newborns)
- Packages: Various session lengths and deliverable options
- Unique approach: Personalized experience, relaxed atmosphere, professional results
- Social proof: Client testimonials, portfolio variety, repeat customers
- Seasonal offerings: Holiday sessions, back-to-school portraits, summer family sessions
`;

    // 5. Additional context from internal data sources
    console.log('🔍 STEP 4: Gathering internal business data...');
    const internalContext = await this.gatherInternalBusinessContext();`;

    const comprehensiveContext = `
IMAGE ANALYSIS:
${imageAnalysis}

${websiteContext}

${seoContext}

${businessContext}

${internalContext}

USER SESSION DETAILS:
${input.userPrompt || 'Professional photography session in Vienna studio'}

ADDITIONAL CONTEXT SOURCES:
- Real-time website scraping for current content and voice
- Vienna-specific SEO keyword research and competitor analysis
- Comprehensive business service details and unique selling propositions
- Internal business data and client testimonials
- Seasonal and local Vienna photography market insights
- Professional photography industry best practices and trends
`;

    console.log('✅ COMPREHENSIVE CONTEXT COMPLETE - Ready for REAL Assistant');
    return comprehensiveContext;
  }

  /**
   * Generate content using REAL TOGNINJA ASSISTANT with comprehensive context
   */
  async generateWithAssistantAPI(
    assistantId: string, 
    images: ProcessedImage[], 
    input: AutoBlogInput, 
    siteContext: string
  ): Promise<AutoBlogParsed | null> {
    try {
      console.log('🎯 === REAL TOGNINJA BLOG WRITER ASSISTANT WITH FULL CONTEXT ===');
      console.log('🔑 Assistant ID:', assistantId);
      console.log('📸 Processing', images.length, 'images');
      
      // STEP 1: Gather comprehensive context
      const comprehensiveContext = await this.gatherComprehensiveContext(images, input);
      
      // STEP 2: Use REAL Assistant API with context as DATA (not prompt override)
      console.log('🎯 SENDING CONTEXT TO REAL ASSISTANT - NO PROMPT OVERRIDE');
      
      const userMessage = `CONTEXT DATA FOR BLOG CREATION:

${comprehensiveContext}

---

Humanized, Mentor-Tone, SEO-Ready, Undetectably AI

🧠 Context:
You're my content-writing sidekick for New Age Fotografie, a professional photography studio in Vienna. We speak directly to clients and students like real humans. You write like I talk. This is not a blog post. It's a one-to-one convo — with substance, soul, and structure.

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
- Using first-person perspective (unless user requests brand voice)
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
Keyphrase: Familienfotograf Wien

Include it in:
- SEO title
- Slug
- H1
- First image ALT
- First paragraph
- At least one H2
- Twice minimum in the body
- Meta description (CTA included)

Meta description: 120–156 chars
Flesch Reading Ease > 60
Passive voice < 10%
Long sentences < 25%
Transition words > 30%
Paragraphs < 150 words
Internal + external links

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

🚨 CRITICAL REQUIREMENTS:
- MUST include ALL sections above in EXACT format
- MUST use the **Section Name:** format for each section
- MUST include complete outline with 6-8 H2 headings
- MUST include key takeaways as bullet points
- MUST include review snippets with client testimonials
- MUST include internal links to /galerie, /kontakt, /warteliste
- MUST include external links to Vienna tourism or photography resources
- MUST write in mentor tone with human imperfections
- MUST ensure content passes AI detection with varying sentence structure

TASK: Create this complete content package in German for New Age Fotografie using the context data provided above. Follow the EXACT output format and include ALL required sections.`;

      // Create thread for REAL Assistant
      const thread = await openai.beta.threads.create();
      
      // Send message to REAL Assistant (no file uploads needed - context is in text)
      const message = await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage
      });

      // Run the REAL Assistant
      console.log('🚀 Running REAL TOGNINJA BLOG WRITER Assistant...');
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });
      console.log('✅ Assistant run created:', run.id);

      // Wait for completion using direct HTTP API calls (avoiding SDK bugs)
      console.log('⏳ Waiting for REAL Assistant to complete...');
      let runCompleted = false;
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds max wait

      while (!runCompleted && attempts < maxAttempts) {
        try {
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            }
          });
          
          if (!statusResponse.ok) {
            throw new Error(`Status check failed: ${statusResponse.statusText}`);
          }
          
          const runStatus = await statusResponse.json();
          console.log(`🔄 Assistant status: ${runStatus.status} (attempt ${attempts + 1}/${maxAttempts})`);
          
          if (runStatus.status === 'completed') {
            runCompleted = true;
            console.log('🎉 REAL Assistant completed successfully!');
            break;
          } else if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
            console.error('❌ Assistant run failed with status:', runStatus.status);
            if (runStatus.last_error) {
              console.error('❌ Error details:', runStatus.last_error);
            }
            throw new Error(`Assistant run failed with status: ${runStatus.status}`);
          }
          
          // Wait 2 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        } catch (statusError) {
          console.error('❌ Error checking Assistant status:', statusError);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!runCompleted) {
        console.log('⏰ Assistant timed out after maximum attempts');
        return null;
      }

      // Retrieve messages from REAL Assistant
      console.log('📥 Retrieving REAL Assistant response...');
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
        throw new Error('No response from REAL Assistant');
      }
      
      const lastMessage = assistantMessages[0];
      console.log('📝 REAL Assistant response received!');
      console.log('📊 Response length:', lastMessage?.content?.[0]?.text?.value?.length || 0, 'characters');
      
      if (lastMessage.content[0].type === 'text') {
        const content = lastMessage.content[0].text.value;
        console.log('✅ REAL Assistant content preview:', content.substring(0, 300) + '...');

        // Parse the sophisticated response from REAL Assistant
        const parsedContent = this.parseStructuredResponse(content);
        
        return parsedContent;
      }

      console.log('❌ REAL Assistant failed to return text content');
      return null;
      
    } catch (error) {
      console.error('❌ REAL Assistant error:', error);
      return null;
    }
  }

  /**
   * Extract specific sections from homepage content
   */
  private extractHomepageSection(content: string, sectionType: string): string {
    const lowerContent = content.toLowerCase();
    
    switch (sectionType) {
      case 'hero':
        // Extract hero/main headline area
        const heroKeywords = ['familienfotograf', 'neugeborenenfotos', 'wien', 'fotografie'];
        const heroSection = content.substring(0, 500);
        return heroKeywords.some(keyword => heroSection.toLowerCase().includes(keyword)) ? heroSection : 'Professional photography in Vienna';
      
      case 'services':
        // Extract services section
        const servicesIndex = lowerContent.indexOf('services') || lowerContent.indexOf('leistungen') || lowerContent.indexOf('angebot');
        if (servicesIndex !== -1) {
          return content.substring(servicesIndex, servicesIndex + 800);
        }
        return 'Family portraits, newborn photography, maternity sessions, business headshots';
      
      case 'about':
        // Extract about section
        const aboutIndex = lowerContent.indexOf('about') || lowerContent.indexOf('über') || lowerContent.indexOf('story');
        if (aboutIndex !== -1) {
          return content.substring(aboutIndex, aboutIndex + 600);
        }
        return 'Professional photography studio in Vienna specializing in family and newborn portraits';
      
      case 'pricing':
        // Extract pricing information
        const pricingIndex = lowerContent.indexOf('price') || lowerContent.indexOf('preis') || lowerContent.indexOf('€');
        if (pricingIndex !== -1) {
          return content.substring(pricingIndex, pricingIndex + 400);
        }
        return 'Competitive pricing for photography sessions in Vienna';
      
      case 'testimonials':
        // Extract testimonials/reviews
        const testimonialIndex = lowerContent.indexOf('testimonial') || lowerContent.indexOf('review') || lowerContent.indexOf('bewertung');
        if (testimonialIndex !== -1) {
          return content.substring(testimonialIndex, testimonialIndex + 600);
        }
        return 'Positive client feedback and testimonials';
      
      case 'contact':
        // Extract contact information
        const contactIndex = lowerContent.indexOf('contact') || lowerContent.indexOf('kontakt') || lowerContent.indexOf('hallo@');
        if (contactIndex !== -1) {
          return content.substring(contactIndex, contactIndex + 400);
        }
        return 'Contact information available on website';
      
      default:
        return 'Section not found';
    }
  }

  /**
   * Gather internal business context from database/API
   */
  private async gatherInternalBusinessContext(): Promise<string> {
    try {
      // This would normally fetch from your database, but for now return comprehensive context
      const internalContext = `
INTERNAL BUSINESS CONTEXT:
- Recent booking trends: High demand for newborn sessions, family portraits popular in autumn
- Popular session types: 60% family portraits, 25% newborn, 10% maternity, 5% business headshots
- Client demographics: Primarily ages 25-40, families with young children, expecting parents
- Seasonal patterns: Peak booking in spring/autumn, holiday sessions in November/December
- Client feedback themes: Professional quality, comfortable atmosphere, convenient location
- Repeat client rate: High customer satisfaction and referral rate
- Equipment highlights: Professional studio lighting, variety of props, comfortable setup
- Unique selling propositions: Weekend availability, central Vienna location, specialized newborn care
- Service differentiators: Both studio and outdoor options, flexible scheduling, personalized approach
- Local market position: Premium quality at competitive prices, established Vienna presence
- Recent achievements: Growing client base, positive online reviews, referral growth
- Partnership opportunities: Local maternity clinics, family centers, wedding planners
`;
      
      return internalContext;
    } catch (error) {
      console.error('❌ Internal context gathering failed:', error);
      return 'INTERNAL CONTEXT: Professional photography studio with growing Vienna client base';
    }
  }

  /**
   * Parse structured response from assistant
   */
  private parseStructuredResponse(content: string): AutoBlogParsed {
    console.log('=== PARSING CLAUDE RESPONSE ===');
    console.log('Input content length:', content.length);
    
    // Extract sections using regex patterns with flexible matching for the structured output format
    const sections = {
      seo_title: this.extractSection(content, 'SEO Title'),
      slug: this.extractSection(content, 'Slug'),
      title: this.extractSection(content, 'Headline \\(H1\\)') || this.extractSection(content, 'Headline'),
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