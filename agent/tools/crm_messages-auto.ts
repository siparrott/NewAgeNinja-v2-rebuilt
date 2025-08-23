// Auto-generated CRUD tools for crm_messages
import { z } from "zod";
import { neon } from '@neondatabase/serverless';
import type { AgentCtx } from "../core/ctx.js";

const sql = neon(process.env.DATABASE_URL!);

/* READ CRM_MESSAGES */
export const readCrmMessages = {
  name: "read_crm_messages",
  description: "Read records from crm_messages table with search and filtering",
  parameters: z.object({
    limit: z.number().default(25).describe("Maximum number of records to return"),
    search: z.string().optional().describe("Search term to filter records"),
    status: z.string().optional().describe("Filter by status if applicable")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      let query = `SELECT * FROM crm_messages`;
      const params = [];
      
      if (args.search) {
        const searchConditions = ["sender_name ILIKE $1", "sender_email ILIKE $2", "subject ILIKE $3", "content ILIKE $4", "status ILIKE $5"];
        query += ` WHERE (${searchConditions.join(' OR ')})`;
        params.push(`%${args.search}%`);
        params.push(`%${args.search}%`);
        params.push(`%${args.search}%`);
        params.push(`%${args.search}%`);
        params.push(`%${args.search}%`);
      }
      
      if (args.status) {
        if (args.search) {
          query += ` AND status = $${params.length + 1}`;
        } else {
          query += ` WHERE status = $${params.length + 1}`;
        }
        params.push(args.status);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(args.limit);
      
      const result = await sql(query, params);
      return {
        success: true,
        data: result,
        count: result.length,
        table: "crm_messages"
      };
    } catch (error) {
      console.error(`❌ read_crm_messages error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Read operation failed",
        table: "crm_messages"
      };
    }
  }
};

/* CREATE CRM_MESSAGES */
export const createCrmMessages = {
  name: "create_crm_messages",
  description: "Create a new record in crm_messages table",
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
        INSERT INTO crm_messages (${columns.join(', ')}) 
        VALUES (${placeholders.join(', ')}) 
        RETURNING *
      `;
      
      const result = await sql(query, values);
      return {
        success: true,
        data: result[0],
        message: `Created new crm_messages record`,
        table: "crm_messages"
      };
    } catch (error) {
      console.error(`❌ create_crm_messages error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Create operation failed",
        table: "crm_messages"
      };
    }
  }
};

/* UPDATE CRM_MESSAGES */
export const updateCrmMessages = {
  name: "update_crm_messages",
  description: "Update an existing record in crm_messages table",
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
        UPDATE crm_messages 
        SET ${setClause}, updated_at = NOW() 
        WHERE id = $${updateFields.length + 1}
        RETURNING *
      `;
      
      const result = await sql(query, [...Object.values(args.data), args.id]);
      
      if (result.length === 0) {
        return {
          success: false,
          error: `No crm_messages record found with id ${args.id}`,
          table: "crm_messages"
        };
      }
      
      return {
        success: true,
        data: result[0],
        message: `Updated crm_messages record`,
        table: "crm_messages"
      };
    } catch (error) {
      console.error(`❌ update_crm_messages error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update operation failed",
        table: "crm_messages"
      };
    }
  }
};
