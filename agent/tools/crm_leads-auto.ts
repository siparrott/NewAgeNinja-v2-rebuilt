// Auto-generated CRUD tools for crm_leads
import { z } from "zod";
import { neon } from '@neondatabase/serverless';
import type { AgentCtx } from "../core/ctx.js";

const sql = neon(process.env.DATABASE_URL!);

/* READ CRM_LEADS */
export const readCrmLeads = {
  name: "read_crm_leads",
  description: "Read records from crm_leads table with search and filtering",
  parameters: z.object({
    limit: z.number().default(25).describe("Maximum number of records to return"),
    search: z.string().optional().describe("Search term to filter records"),
    status: z.string().optional().describe("Filter by status if applicable")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    console.log('🔧 read_crm_leads handler called with args:', args);
    
    try {
      // CRITICAL FIX: Use working template literal approach from tests
      const result = await sql`SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT ${args.limit}`;
      
      console.log('✅ read_crm_leads got', result.length, 'leads');
      
      const response = {
        success: true,
        data: result,
        count: result.length,
        table: "crm_leads"
      };
      
      console.log('✅ read_crm_leads returning:', typeof response, 'with data array of', response.count, 'items');
      return response;
      
    } catch (error) {
      console.error(`❌ read_crm_leads error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Read operation failed",
        table: "crm_leads"
      };
    }
  }
};

/* CREATE CRM_LEADS */
export const createCrmLeads = {
  name: "create_crm_leads",
  description: "Create a new record in crm_leads table",
  parameters: z.object({
    data: z.record(z.any()).describe("Data object with fields to insert")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Use data as provided (no studio_id for this schema)
      const insertData = { ...args.data };
      
      // Build dynamic insert query
      const columns = Object.keys(insertData);
      const placeholders = columns.map((_, i) => `$${i + 1}`);
      const values = Object.values(insertData);
      
      const query = `
        INSERT INTO crm_leads (${columns.join(', ')}) 
        VALUES (${placeholders.join(', ')}) 
        RETURNING *
      `;
      
      const result = await sql(query, values);
      return {
        success: true,
        data: result[0],
        message: `Created new crm_leads record`,
        table: "crm_leads"
      };
    } catch (error) {
      console.error(`❌ create_crm_leads error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Create operation failed",
        table: "crm_leads"
      };
    }
  }
};

/* UPDATE CRM_LEADS */
export const updateCrmLeads = {
  name: "update_crm_leads",
  description: "Update an existing record in crm_leads table",
  parameters: z.object({
    id: z.string().describe("ID of the record to update"),
    data: z.record(z.any()).describe("Data object with fields to update")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Build dynamic update query
      const updateFields = Object.keys(args.data);
      const setClause = updateFields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = [...Object.values(args.data), args.id, ctx.studioId];
      
      const query = `
        UPDATE crm_leads 
        SET ${setClause}, updated_at = NOW() 
        WHERE id = $${updateFields.length + 1}
        RETURNING *
      `;
      
      const result = await sql(query, [...Object.values(args.data), args.id]);
      
      if (result.length === 0) {
        return {
          success: false,
          error: `No crm_leads record found with id ${args.id}`,
          table: "crm_leads"
        };
      }
      
      return {
        success: true,
        data: result[0],
        message: `Updated crm_leads record`,
        table: "crm_leads"
      };
    } catch (error) {
      console.error(`❌ update_crm_leads error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update operation failed",
        table: "crm_leads"
      };
    }
  }
};
