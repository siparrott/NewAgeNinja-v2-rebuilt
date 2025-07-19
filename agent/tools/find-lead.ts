import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

export const findLeadTool = {
  name: "find_lead",
  description: "Fetch a single lead by exact email or id. Use after broad search to confirm.",
  parameters: z.object({
    email: z.string().email().optional(),
    id: z.string().uuid().optional()
  }).refine(v => v.email || v.id, "email or id required"),
  handler: async (a: any, ctx: AgentCtx) => {
    try {
      let query = "SELECT * FROM crm_leads WHERE ";
      const params: any[] = [];
      
      if (a.id) {
        query += "id = $1";
        params.push(a.id);
      } else if (a.email) {
        query += "email = $1";
        params.push(a.email);
      }
      
      query += " LIMIT 1";
      
      const data = await sql(query, params);
      return data[0] || null;
    } catch (error: any) {
      console.error('[find_lead]', error);
      throw new Error(`supabase:${error.code || error.message}`);
    }
  }
};