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
      // Skip embedding for now and go straight to text search
      
      // Search knowledge base using simple text search (fallback for now)
      const results = await sql`
        SELECT 
          id, 
          title, 
          SUBSTRING(content, 1, 240) || CASE 
            WHEN LENGTH(content) > 240 THEN ' ...' 
            ELSE '' 
          END as snippet,
          category
        FROM knowledge_base 
        WHERE is_active = true
          AND (title ILIKE ${'%' + args.query + '%'} OR content ILIKE ${'%' + args.query + '%'})
        ORDER BY title
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
          SELECT id, title, SUBSTRING(content, 1, 240) as snippet, category
          FROM knowledge_base 
          WHERE is_active = true
            AND (title ILIKE ${'%' + args.query + '%'} OR content ILIKE ${'%' + args.query + '%'})
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