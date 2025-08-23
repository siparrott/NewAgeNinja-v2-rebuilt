import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx.js";
import { requireAuthority } from "../core/authz.js";

const sql = neon(process.env.DATABASE_URL!);

export const listLeadsTool = {
  name: "list_leads",
  description: "List leads with user-friendly formatting. Use this when user asks to 'list leads', 'show leads', or similar requests.",
  parameters: z.object({
    limit: z.number().default(10).describe("Number of leads to show"),
    status: z.enum(["new", "contacted", "qualified", "converted", "closed"]).optional().describe("Filter by specific status"),
    recent: z.boolean().default(true).describe("Show most recent leads first")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    
    console.log(`📋 list_leads: Fetching ${args.limit} leads${args.status ? ` with status ${args.status}` : ''}`);
    
    try {
      let query = `
        SELECT id, name, email, phone, status, source, message, created_at
        FROM crm_leads 
        WHERE id IS NOT NULL
      `;
      
      const queryParams: any[] = [];
      
      if (args.status) {
        query += ` AND status = $${queryParams.length + 1}`;
        queryParams.push(args.status);
      }
      
      query += args.recent 
        ? ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`
        : ` ORDER BY name ASC LIMIT $${queryParams.length + 1}`;
      queryParams.push(args.limit);
      
      const leads = await sql(query, queryParams);
      
      console.log(`✅ list_leads: Found ${leads.length} leads`);
      
      // Format for user-friendly display
      if (leads.length === 0) {
        return {
          status: "success",
          message: args.status 
            ? `No ${args.status} leads found in your CRM.`
            : "No leads found in your CRM database.",
          count: 0,
          leads: []
        };
      }
      
      const formattedLeads = leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || 'No phone',
        status: lead.status || 'new',
        source: lead.source || 'Unknown',
        message: lead.message ? (lead.message.length > 100 ? lead.message.substring(0, 100) + '...' : lead.message) : 'No message',
        created: new Date(lead.created_at).toLocaleDateString('de-DE')
      }));
      
      return {
        status: "success",
        count: leads.length,
        leads: formattedLeads,
        summary: `Found ${leads.length} lead${leads.length > 1 ? 's' : ''}${args.status ? ` with status: ${args.status}` : ''}`
      };
      
    } catch (error: any) {
      console.error('[list_leads]', error);
      throw new Error(`supabase:${error.code || error.message}`);
    }
  }
};