import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx.js";

const sql = neon(process.env.DATABASE_URL!);

export const readCrmLeads = {
  name: "read_crm_leads",
  description: "List leads (filtered by optional search across name/email/message). ALWAYS use this before stating anything about leads.",
  parameters: z.object({
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(25)
  }),
  handler: async (a: any, ctx: AgentCtx) => {
    try {
      let query = "SELECT * FROM crm_leads ORDER BY created_at DESC";
      const params: any[] = [];
      
      if (a.search) {
        const term = `%${a.search.trim().toLowerCase()}%`;
        query = `
          SELECT * FROM crm_leads 
          WHERE (
            LOWER(name) LIKE $1 OR 
            LOWER(email) LIKE $1 OR 
            LOWER(message) LIKE $1
          )
          ORDER BY created_at DESC
        `;
        params.push(term);
      }
      
      query += ` LIMIT ${a.limit}`;
      
      const data = await sql(query, params);
      return data;
    } catch (error: any) {
      throw new Error("lead_query_failed: " + error.message);
    }
  }
};