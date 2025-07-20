import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

export const kbSearchTool = {
  name: "kb_search",
  description: "Search studio knowledge base for domain-specific information, best practices, or documentation. Returns top 3 most relevant documents.",
  parameters: z.object({
    query: z.string().describe("Search query for knowledge base (e.g. 'invoice workflow', 'client onboarding', 'pricing strategy')")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Generate embedding for search query
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: args.query
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      // Search knowledge base using vector similarity
      const results = await sql`
        SELECT 
          id, 
          title, 
          SUBSTRING(body_markdown, 1, 240) || CASE 
            WHEN LENGTH(body_markdown) > 240 THEN ' ...' 
            ELSE '' 
          END as snippet,
          category,
          (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as distance
        FROM crm_kb 
        WHERE studio_id = ${ctx.studioId}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT 3
      `;
      
      if (results.length === 0) {
        return {
          found: false,
          message: "No knowledge base entries found. Consider adding documentation for this topic.",
          suggestion: "You can create knowledge base entries through the admin panel to help future queries."
        };
      }
      
      return {
        found: true,
        query: args.query,
        results: results.map(row => ({
          id: row.id,
          title: row.title,
          snippet: row.snippet,
          category: row.category,
          relevance_score: (1 - row.distance).toFixed(3)
        }))
      };
      
    } catch (error) {
      console.error('❌ kb_search error:', error);
      
      // Fallback to basic text search if vector search fails
      try {
        const fallbackResults = await sql`
          SELECT id, title, SUBSTRING(body_markdown, 1, 240) as snippet, category
          FROM crm_kb 
          WHERE studio_id = ${ctx.studioId}
            AND (title ILIKE ${'%' + args.query + '%'} OR body_markdown ILIKE ${'%' + args.query + '%'})
          LIMIT 3
        `;
        
        return {
          found: fallbackResults.length > 0,
          fallback_search: true,
          query: args.query,
          results: fallbackResults.map(row => ({
            id: row.id,
            title: row.title,
            snippet: row.snippet,
            category: row.category,
            relevance_score: "text_match"
          }))
        };
      } catch (fallbackError) {
        throw new Error(`kb_search:failed - ${error.message}`);
      }
    }
  }
};