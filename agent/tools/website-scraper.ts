import { z } from 'zod';
import * as cheerio from 'cheerio';

// Website Information Access Tool for CRM Agent
export const websiteScraperTool = {
  name: "scrape_website_content",
  description: "Scrape and analyze website content to answer service-based questions",
  parameters: z.object({
    url: z.string().url().default("http://localhost:5000"),
    sections: z.array(z.string()).default(["services", "pricing", "about", "contact"])
  }),
  execute: async (params: any) => {
    try {
      const response = await fetch(params.url);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract key information from the website
      const websiteContent = {
        title: $('title').text(),
        meta_description: $('meta[name="description"]').attr('content'),
        h1: $('h1').first().text(),
        h2_headings: $('h2').map((i, el) => $(el).text()).get(),
        services_content: $('[class*="service"], [id*="service"]').map((i, el) => $(el).text()).get(),
        pricing_content: $('[class*="price"], [id*="price"]').map((i, el) => $(el).text()).get(),
        contact_info: {
          phone: $('a[href^="tel:"]').text() || $('#phone').text(),
          email: $('a[href^="mailto:"]').text() || $('#email').text(),
          address: $('[class*="address"], [id*="address"]').text()
        }
      };
      
      return {
        success: true,
        url: params.url,
        content: websiteContent,
        extracted_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Website scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};