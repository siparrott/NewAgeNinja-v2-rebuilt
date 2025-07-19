import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx";
import { requireAuthority } from "../core/authz";

const sql = neon(process.env.DATABASE_URL!);

export const countInvoicesTool = {
  name: "count_invoices",
  description: "Count invoices for a specific year (defaults to current year)",
  parameters: z.object({
    year: z.number().optional().describe("Year to count invoices for (defaults to current year)")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    
    const year = args.year ?? new Date().getFullYear();
    console.log(`📊 count_invoices: Counting invoices for year ${year}`);
    
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM crm_invoices
        WHERE issue_date >= ${`${year}-01-01`}
        AND issue_date <= ${`${year}-12-31`}
      `;
      
      const count = parseInt(result[0]?.count || '0');
      console.log(`✅ count_invoices: Found ${count} invoices for ${year}`);
      
      return { 
        year, 
        count,
        table: "crm_invoices"
      };
      
    } catch (error: any) {
      console.error('[count_invoices]', error);
      throw new Error(`supabase:${error.code || error.message}`);
    }
  }
};

export const countSessionsTool = {
  name: "count_sessions",
  description: "Count photography sessions for a specific year (defaults to current year)",
  parameters: z.object({
    year: z.number().optional().describe("Year to count sessions for (defaults to current year)")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    
    const year = args.year ?? new Date().getFullYear();
    console.log(`📊 count_sessions: Counting sessions for year ${year}`);
    
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM photography_sessions
        WHERE start_time >= ${`${year}-01-01`}
        AND start_time <= ${`${year}-12-31`}
      `;
      
      const count = parseInt(result[0]?.count || '0');
      console.log(`✅ count_sessions: Found ${count} sessions for ${year}`);
      
      return { 
        year, 
        count,
        table: "photography_sessions"
      };
      
    } catch (error: any) {
      console.error('[count_sessions]', error);
      throw new Error(`supabase:${error.code || error.message}`);
    }
  }
};

export const countLeadsTool = {
  name: "count_leads", 
  description: "Count leads for a specific year (defaults to current year)",
  parameters: z.object({
    year: z.number().optional().describe("Year to count leads for (defaults to current year)"),
    status: z.string().optional().describe("Filter by lead status")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    
    const year = args.year ?? new Date().getFullYear();
    console.log(`📊 count_leads: Counting leads for year ${year}`);
    
    try {
      let query = `
        SELECT COUNT(*) as count FROM crm_leads
        WHERE created_at >= $1
        AND created_at <= $2
      `;
      
      const params = [`${year}-01-01`, `${year}-12-31`];
      
      if (args.status) {
        query += ` AND status = $3`;
        params.push(args.status);
      }
      
      const result = await sql(query, params);
      const count = parseInt(result[0]?.count || '0');
      console.log(`✅ count_leads: Found ${count} leads for ${year}`);
      
      return { 
        year, 
        count,
        status: args.status || "all",
        table: "crm_leads"
      };
      
    } catch (error: any) {
      console.error('[count_leads]', error);
      throw new Error(`supabase:${error.code || error.message}`);
    }
  }
};