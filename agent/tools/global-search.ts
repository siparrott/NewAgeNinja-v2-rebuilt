import { z } from "zod";
import type { AgentCtx } from "../core/ctx.js";
import { requireAuthority } from "../core/authz.js";

/**
 * Search across the main CRM tables for a free-text term.
 * Returns buckets: clients, leads, invoices, sessions.
 */
export const globalSearchTool = {
  name: "global_search",
  description:
    "Free-text search across clients, leads, invoices, sessions. Use when you need any record and don't know the specific ID.",
  parameters: z.object({
    term: z.string().min(2, "Need at least 2 characters")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    
    // FIX: Extract actual search terms from full sentences
    let rawTerm = args.term || args.searchTerm || '';
    
    // Split on punctuation and take first meaningful part
    const terms = rawTerm.split(/[,.;?!]/)[0].trim();
    
    // Remove common helper words that interfere with search
    const cleanedTerm = terms
      .replace(/^(find|search|get|show|tell me about|look for|locate)\s+/i, '')
      .replace(/\s+(for me|please)$/i, '')
      .trim();
    
    const term = (cleanedTerm || rawTerm).toLowerCase();
    if (!term) {
      throw new Error('Search term is required');
    }
    console.log(`🔍 global_search: Searching for "${term}" (cleaned from: "${rawTerm}")`);
    
    try {
      // Use the same connection approach as other CRM tools
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Split term for better name matching (e.g. "simon parrott" -> ["simon", "parrott"])
      const termParts = term.split(/\s+/).filter(part => part.length > 0);
      const firstTerm = termParts[0] || term;
      const lastTerm = termParts[1] || firstTerm;
      
      const [clientsResult, leadsResult, invoicesResult, sessionsResult] = await Promise.all([
        sql`
          SELECT *, (first_name || ' ' || last_name) as name FROM crm_clients 
          WHERE (
            LOWER(first_name) LIKE ${`%${firstTerm}%`} OR 
            LOWER(last_name) LIKE ${`%${lastTerm}%`} OR 
            LOWER(email) LIKE ${`%${term}%`} OR
            LOWER(first_name || ' ' || last_name) LIKE ${`%${term}%`}
          )
          AND id IS NOT NULL
          LIMIT 10
        `,
        
        sql`
          SELECT * FROM crm_leads 
          WHERE (LOWER(name) LIKE ${`%${term}%`} OR LOWER(email) LIKE ${`%${term}%`} OR LOWER(phone) LIKE ${`%${term}%`})
          AND id IS NOT NULL
          LIMIT 10
        `,
        
        sql`
          SELECT * FROM crm_invoices 
          WHERE LOWER(invoice_number) LIKE ${`%${term}%`}
          AND id IS NOT NULL
          LIMIT 10
        `,
        
        sql`
          SELECT * FROM photography_sessions 
          WHERE LOWER(notes) LIKE ${`%${term}%`}
          AND id IS NOT NULL
          LIMIT 10
        `
      ]);
      
      const results = {
        clients: clientsResult || [],
        leads: leadsResult || [],
        invoices: invoicesResult || [],
        sessions: sessionsResult || []
      };
      
      console.log(`✅ global_search: Found ${results.clients.length} clients, ${results.leads.length} leads, ${results.invoices.length} invoices, ${results.sessions.length} sessions`);
      
      // Debug Simon Parrott specifically
      if (term.includes('simon')) {
        console.log('🔍 Simon search debug:', {
          searchTerm: term,
          leadsFound: results.leads.length,
          leadNames: results.leads.map(l => l.name).slice(0, 5)
        });
      }
      
      // Enhanced response formatting
      const totalResults = results.clients.length + results.leads.length + results.invoices.length + results.sessions.length;
      
      return {
        ...results,
        summary: {
          total_results: totalResults,
          breakdown: {
            clients: results.clients.length,
            leads: results.leads.length,
            invoices: results.invoices.length,
            sessions: results.sessions.length
          },
          search_term: term,
          message: totalResults > 0 
            ? `Found ${totalResults} results across CRM database for "${term}"`
            : `No results found for "${term}" - try broader search terms or check spelling`
        }
      };
    } catch (error: any) {
      console.error('[global_search]', error);
      throw new Error(`supabase:${error.code || error.message}`);
    }
  }
};