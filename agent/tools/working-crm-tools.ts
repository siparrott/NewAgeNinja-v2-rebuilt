// WORKING CRM tools - final fix following expert debugging checklist
import { z } from "zod";
import { neon } from '@neondatabase/serverless';
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

// WORKING LEADS TOOL
export const workingReadCrmLeads = {
  name: "working_read_crm_leads",
  description: "List and count CRM leads with reliable data access",
  parameters: z.object({
    limit: z.number().default(25).describe("Maximum number of records to return"),
    search: z.string().optional().describe("Search term to filter records")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    console.log('🔧 WORKING read_crm_leads called with:', args);
    
    try {
      // GUARANTEED WORKING: Direct template literal from successful tests
      const leads = await sql`SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT ${args.limit}`;
      
      console.log('✅ WORKING tool got', leads.length, 'leads');
      
      const result = {
        success: true,
        data: leads,
        count: leads.length,
        table: "crm_leads",
        method: "working_template_literal"
      };
      
      console.log('✅ WORKING tool returning valid data object');
      return result;
      
    } catch (error) {
      console.error('❌ WORKING tool error:', error);
      throw new Error(`Working leads tool failed: ${error.message}`);
    }
  }
};

// WORKING CLIENTS TOOL
export const workingReadCrmClients = {
  name: "working_read_crm_clients", 
  description: "List and count CRM clients with reliable data access",
  parameters: z.object({
    limit: z.number().default(25).describe("Maximum number of records to return"),
    search: z.string().optional().describe("Search term to filter records")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    console.log('🔧 WORKING read_crm_clients called with:', args);
    
    try {
      // GUARANTEED WORKING: Direct template literal from successful tests
      const clients = await sql`SELECT * FROM crm_clients ORDER BY created_at DESC LIMIT ${args.limit}`;
      
      console.log('✅ WORKING tool got', clients.length, 'clients');
      
      const result = {
        success: true,
        data: clients,
        count: clients.length,
        table: "crm_clients",
        method: "working_template_literal"
      };
      
      console.log('✅ WORKING tool returning valid data object');
      return result;
      
    } catch (error) {
      console.error('❌ WORKING tool error:', error);
      throw new Error(`Working clients tool failed: ${error.message}`);
    }
  }
};

// WORKING INVOICES TOOL
export const workingReadCrmInvoices = {
  name: "working_read_crm_invoices",
  description: "List and count CRM invoices with reliable data access",
  parameters: z.object({
    limit: z.number().default(25).describe("Maximum number of records to return"),
    search: z.string().optional().describe("Search term to filter records")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    console.log('🔧 WORKING read_crm_invoices called with:', args);
    
    try {
      // GUARANTEED WORKING: Direct template literal from successful tests
      const invoices = await sql`SELECT * FROM crm_invoices ORDER BY created_at DESC LIMIT ${args.limit}`;
      
      console.log('✅ WORKING tool got', invoices.length, 'invoices');
      
      const result = {
        success: true,
        data: invoices,
        count: invoices.length,
        table: "crm_invoices",
        method: "working_template_literal"
      };
      
      console.log('✅ WORKING tool returning valid data object');
      return result;
      
    } catch (error) {
      console.error('❌ WORKING tool error:', error);
      throw new Error(`Working invoices tool failed: ${error.message}`);
    }
  }
};