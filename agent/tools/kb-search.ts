import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx.js";

const sql = neon(process.env.DATABASE_URL!);

export const kbSearchTool = {
  name: "kb_search",
  description: "Search the knowledge base for relevant information to help answer questions or solve problems. Use when you need domain knowledge or context about the business.",
  parameters: z.object({
    query: z.string().describe("Search query for the knowledge base"),
    limit: z.number().default(5).describe("Maximum number of results to return"),
    category: z.string().optional().describe("Filter by knowledge category (business, technical, procedures)")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Ensure knowledge base table exists
      await ensureKnowledgeBaseTable();
      
      let searchQuery;
      if (args.category) {
        searchQuery = sql`
          SELECT id, title, content, category, tags, created_at,
                 ts_rank(search_vector, plainto_tsquery('english', ${args.query})) as rank
          FROM knowledge_base 
          WHERE search_vector @@ plainto_tsquery('english', ${args.query})
            AND category = ${args.category}
            AND is_active = true
          ORDER BY rank DESC, created_at DESC
          LIMIT ${args.limit}
        `;
      } else {
        searchQuery = sql`
          SELECT id, title, content, category, tags, created_at,
                 ts_rank(search_vector, plainto_tsquery('english', ${args.query})) as rank
          FROM knowledge_base 
          WHERE search_vector @@ plainto_tsquery('english', ${args.query})
            AND is_active = true
          ORDER BY rank DESC, created_at DESC
          LIMIT ${args.limit}
        `;
      }
      
      const results = await searchQuery;
      
      if (results.length === 0) {
        // Fallback to fuzzy matching if no full-text results
        const fallbackQuery = sql`
          SELECT id, title, content, category, tags, created_at, 0.1 as rank
          FROM knowledge_base 
          WHERE (title ILIKE ${'%' + args.query + '%'} OR content ILIKE ${'%' + args.query + '%'})
            AND is_active = true
          ORDER BY created_at DESC
          LIMIT ${Math.min(args.limit, 3)}
        `;
        
        const fallbackResults = await fallbackQuery;
        
        return {
          success: true,
          query: args.query,
          results_found: fallbackResults.length,
          search_type: "fuzzy_match",
          articles: fallbackResults.map(result => ({
            id: result.id,
            title: result.title,
            content: result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''),
            category: result.category,
            tags: result.tags || [],
            relevance_score: result.rank
          }))
        };
      }
      
      return {
        success: true,
        query: args.query,
        results_found: results.length,
        search_type: "full_text_search",
        articles: results.map(result => ({
          id: result.id,
          title: result.title,
          content: result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''),
          category: result.category,
          tags: result.tags || [],
          relevance_score: Number(result.rank).toFixed(3)
        }))
      };
      
    } catch (error) {
      console.error('❌ kb_search error:', error);
      return {
        success: false,
        error: `Knowledge base search failed: ${error.message}`,
        query: args.query,
        results_found: 0,
        articles: []
      };
    }
  }
};

// Ensure knowledge base table exists with full-text search
async function ensureKnowledgeBaseTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        search_vector tsvector
      )
    `;
    
    // Create full-text search index
    await sql`
      CREATE INDEX IF NOT EXISTS knowledge_base_search_idx 
      ON knowledge_base USING GIN (search_vector)
    `;
    
    // Create trigger to maintain search vector
    await sql`
      CREATE OR REPLACE FUNCTION update_knowledge_base_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS knowledge_base_search_vector_trigger ON knowledge_base
    `;
    
    await sql`
      CREATE TRIGGER knowledge_base_search_vector_trigger
      BEFORE INSERT OR UPDATE ON knowledge_base
      FOR EACH ROW EXECUTE FUNCTION update_knowledge_base_search_vector()
    `;
    
    // Seed with initial knowledge if empty
    const count = await sql`SELECT COUNT(*) as count FROM knowledge_base`;
    if (count[0].count === 0) {
      await seedInitialKnowledge();
    }
    
  } catch (error) {
    console.error('❌ Failed to ensure knowledge base table:', error);
    throw error;
  }
}

// Seed with initial business knowledge
async function seedInitialKnowledge() {
  const initialKnowledge = [
    {
      title: "Photography Session Types",
      content: "New Age Fotografie offers several session types: Family portraits (€295), Newborn photography (€450), Maternity sessions (€250), Business headshots (€195), and couple portraits (€225). Each session includes professional editing and a private online gallery.",
      category: "business",
      tags: ["pricing", "services", "photography"]
    },
    {
      title: "Invoice Creation Process", 
      content: "To create an invoice: 1) Find or create the client record, 2) Select appropriate SKU (DIGI-10, FAMILY-BASIC, etc.), 3) Generate invoice with proper line items, 4) Send to client via email. Standard payment terms are 30 days.",
      category: "procedures",
      tags: ["invoices", "billing", "workflow"]
    },
    {
      title: "Digital File Delivery",
      content: "Digital files are delivered through a secure client portal within 2-3 business days after session. Packages include: DIGI-10 (€350 for 10 files), DIGI-20 (€595 for 20 files). Files are high-resolution and print-ready.",
      category: "business", 
      tags: ["digital", "delivery", "packages"]
    },
    {
      title: "Client Communication Guidelines",
      content: "Professional email tone, respond within 24 hours, always confirm session details 48 hours prior. Use client's preferred name, include studio contact info (hallo@newagefotografie.com, +43 677 933 99210).",
      category: "procedures",
      tags: ["communication", "customer-service", "email"]
    },
    {
      title: "Studio Location and Hours",
      content: "New Age Fotografie studio located at Schönbrunner Str. 25, 1050 Wien, Austria. Operating hours: Friday-Sunday 09:00-17:00. 5 minutes from Kettenbrückengasse, street parking available.",
      category: "business",
      tags: ["location", "hours", "vienna", "studio"]
    }
  ];
  
  for (const knowledge of initialKnowledge) {
    await sql`
      INSERT INTO knowledge_base (title, content, category, tags)
      VALUES (${knowledge.title}, ${knowledge.content}, ${knowledge.category}, ${knowledge.tags})
    `;
  }
  
  console.log(`✅ Seeded ${initialKnowledge.length} knowledge base articles`);
}