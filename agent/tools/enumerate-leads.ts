import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

export const enumerateLeadsTool = {
  name: "enumerate_leads_basic",
  description: "Return just id, name, email of the latest 50 leads (fallback when search unexpectedly empty).",
  parameters: z.object({}),
  handler: async (_: any, ctx: AgentCtx) => {
    try {
      const query = `
        SELECT id, name, email 
        FROM crm_leads 
        ORDER BY created_at DESC 
        LIMIT 50
      `;
      
      const data = await sql(query);
      return data;
    } catch (error: any) {
      throw new Error("enumerate_leads_failed: " + error.message);
    }
  }
};