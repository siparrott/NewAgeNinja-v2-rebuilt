import { z } from "zod";
import type { AgentCtx } from "../core/ctx";
import { requireAuthority } from "../core/authz";

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
    
    const term = args.term.toLowerCase();
    console.log(`🔍 global_search: Searching for "${term}"`);
    
    try {
      // Use the same connection approach as other CRM tools
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const [clientsResult, leadsResult, invoicesResult, sessionsResult] = await Promise.all([
        sql`
          SELECT * FROM crm_clients 
          WHERE (LOWER(first_name) LIKE ${`%${term}%`} OR LOWER(last_name) LIKE ${`%${term}%`} OR LOWER(email) LIKE ${`%${term}%`})
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
      
      return results;
    } catch (error) {
      console.error('❌ global_search error:', error);
      return {
        clients: [],
        leads: [],
        invoices: [],
        sessions: [],
        error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
};