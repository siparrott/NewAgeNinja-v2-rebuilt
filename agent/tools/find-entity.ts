import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx.js";
import { requireAuthority } from "../core/authz.js";

const sql = neon(process.env.DATABASE_URL!);

export const findEntityTool = {
  name: "find_entity",
  description: "Find a person by name or email across leads and clients tables. Returns the best match with status.",
  parameters: z.object({
    query: z.string().min(1).describe("Name, email, or phone to search for")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    
    const query = args.query.toLowerCase();
    console.log(`🔍 find_entity: Searching for "${query}"`);
    
    try {
      // Search leads first
      const leads = await sql`
        SELECT *, 'lead' as source_type FROM crm_leads 
        WHERE (LOWER(name) LIKE ${`%${query}%`} OR LOWER(email) LIKE ${`%${query}%`} OR LOWER(phone) LIKE ${`%${query}%`})
        AND id IS NOT NULL
        ORDER BY 
          CASE 
            WHEN LOWER(email) = ${query} THEN 1
            WHEN LOWER(name) = ${query} THEN 2
            WHEN LOWER(email) LIKE ${`${query}%`} THEN 3
            WHEN LOWER(name) LIKE ${`${query}%`} THEN 4
            ELSE 5
          END
        LIMIT 5
      `;
      
      if (leads.length > 0) {
        const best = leads[0];
        console.log(`✅ find_entity: Found lead ${best.name} (${best.email})`);
        return { 
          status: "lead", 
          match: best,
          total_results: leads.length,
          all_matches: leads
        };
      }

      // Search clients if no leads found
      const clients = await sql`
        SELECT *, 'client' as source_type FROM crm_clients 
        WHERE (
          LOWER(first_name) LIKE ${`%${query}%`} OR 
          LOWER(last_name) LIKE ${`%${query}%`} OR 
          LOWER(CONCAT(first_name, ' ', last_name)) LIKE ${`%${query}%`} OR
          LOWER(email) LIKE ${`%${query}%`} OR 
          LOWER(phone) LIKE ${`%${query}%`}
        )
        AND id IS NOT NULL
        ORDER BY 
          CASE 
            WHEN LOWER(email) = ${query} THEN 1
            WHEN LOWER(CONCAT(first_name, ' ', last_name)) = ${query} THEN 2
            WHEN LOWER(email) LIKE ${`${query}%`} THEN 3
            WHEN LOWER(CONCAT(first_name, ' ', last_name)) LIKE ${`${query}%`} THEN 4
            WHEN LOWER(first_name) LIKE ${`${query}%`} THEN 5
            WHEN LOWER(last_name) LIKE ${`${query}%`} THEN 6
            ELSE 7
          END
        LIMIT 5
      `;
      
      if (clients.length > 0) {
        const best = clients[0];
        console.log(`✅ find_entity: Found client ${best.first_name} ${best.last_name} (${best.email})`);
        return { 
          status: "client", 
          match: best,
          total_results: clients.length,
          all_matches: clients
        };
      }

      console.log(`❌ find_entity: No matches found for "${query}"`);
      return { 
        status: "not_found",
        query: args.query,
        searched_in: ["crm_leads", "crm_clients"]
      };
      
    } catch (error: any) {
      console.error('[find_entity]', error);
      throw new Error(`supabase:${error.code || error.message}`);
    }
  }
};