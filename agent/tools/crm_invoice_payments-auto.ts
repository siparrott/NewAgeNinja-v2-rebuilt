// Auto-generated CRUD tools for crm_invoice_payments
import { z } from "zod";
import { neon } from '@neondatabase/serverless';
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

/* READ CRM_INVOICE_PAYMENTS */
export const readCrmInvoicePayments = {
  name: "read_crm_invoice_payments",
  description: "Read records from crm_invoice_payments table with search and filtering",
  parameters: z.object({
    limit: z.number().default(25).describe("Maximum number of records to return"),
    search: z.string().optional().describe("Search term to filter records"),
    status: z.string().optional().describe("Filter by status if applicable")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      let query = `SELECT * FROM crm_invoice_payments`;
      const params = [];
      
      if (args.search) {
        const searchConditions = ["payment_method ILIKE $1", "payment_reference ILIKE $2", "notes ILIKE $3"];
        query += ` WHERE (${searchConditions.join(' OR ')})`;
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
        table: "crm_invoice_payments"
      };
    } catch (error) {
      console.error(`❌ read_crm_invoice_payments error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Read operation failed",
        table: "crm_invoice_payments"
      };
    }
  }
};

/* CREATE CRM_INVOICE_PAYMENTS */
export const createCrmInvoicePayments = {
  name: "create_crm_invoice_payments",
  description: "Create a new record in crm_invoice_payments table",
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
        INSERT INTO crm_invoice_payments (${columns.join(', ')}) 
        VALUES (${placeholders.join(', ')}) 
        RETURNING *
      `;
      
      const result = await sql(query, values);
      return {
        success: true,
        data: result[0],
        message: `Created new crm_invoice_payments record`,
        table: "crm_invoice_payments"
      };
    } catch (error) {
      console.error(`❌ create_crm_invoice_payments error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Create operation failed",
        table: "crm_invoice_payments"
      };
    }
  }
};

/* UPDATE CRM_INVOICE_PAYMENTS */
export const updateCrmInvoicePayments = {
  name: "update_crm_invoice_payments",
  description: "Update an existing record in crm_invoice_payments table",
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
        UPDATE crm_invoice_payments 
        SET ${setClause}, updated_at = NOW() 
        WHERE id = $${updateFields.length + 1}
        RETURNING *
      `;
      
      const result = await sql(query, [...Object.values(args.data), args.id]);
      
      if (result.length === 0) {
        return {
          success: false,
          error: `No crm_invoice_payments record found with id ${args.id}`,
          table: "crm_invoice_payments"
        };
      }
      
      return {
        success: true,
        data: result[0],
        message: `Updated crm_invoice_payments record`,
        table: "crm_invoice_payments"
      };
    } catch (error) {
      console.error(`❌ update_crm_invoice_payments error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update operation failed",
        table: "crm_invoice_payments"
      };
    }
  }
};
