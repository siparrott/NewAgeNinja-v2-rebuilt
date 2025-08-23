import { z } from "zod";
import type { AgentCtx } from "../core/ctx.js";
import { requireAuthority } from "../core/authz.js";
import { getClientsForStudio, getLeadsForStudio, getSessionsForStudio, getInvoicesForStudio } from "../integrations/crm-data.js";

export const listClientsTool = {
  name: "list_clients",
  description: "List clients for the current studio. Optional search & limit.",
  parameters: z.object({
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(25),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      requireAuthority(ctx, "READ_CLIENTS");
      console.log(`🔍 list_clients: Searching for "${args.search || 'all clients'}"`);
      let clients = await getClientsForStudio(ctx.studioId);
      console.log(`✅ list_clients: Found ${clients.length} total clients`);
      
      if (args.search) {
        const s = String(args.search).toLowerCase().trim();
        clients = clients.filter((c: any) => {
          // Handle both camelCase and snake_case column names
          const firstName = (c.firstName || c.first_name || "").toLowerCase();
          const lastName = (c.lastName || c.last_name || "").toLowerCase();
          const email = (c.email || "").toLowerCase();
          const fullName = `${firstName} ${lastName}`.trim();
          
          console.log(`🔍 Checking client: "${firstName}" "${lastName}" "${email}" against search "${s}"`);
          
          const match = firstName.includes(s) || 
                       lastName.includes(s) || 
                       email.includes(s) || 
                       fullName.includes(s);
          
          if (match) {
            console.log(`✅ MATCH found: ${firstName} ${lastName} (${email})`);
          }
          
          return match;
        });
        console.log(`🔍 list_clients: Filtered to ${clients.length} clients matching "${s}"`);
      }
      return clients.slice(0, args.limit);
    } catch (error) {
      console.error('❌ list_clients error:', error);
      return { error: `Failed to fetch clients: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  }
};

export const listLeadsTool = {
  name: "list_leads",
  description: "List leads for the current studio. Optional search & limit.",
  parameters: z.object({
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(25),
    status: z.enum(["new", "contacted", "qualified", "converted", "closed"]).optional(),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      requireAuthority(ctx, "READ_LEADS");
      console.log(`🔍 list_leads: Fetching leads for studio ${ctx.studioId}`);
      let leads = await getLeadsForStudio(ctx.studioId);
      console.log(`✅ list_leads: Found ${leads.length} leads`);
    
      if (args.status) {
        leads = leads.filter((l: any) => l.status === args.status);
      }
      
      if (args.search) {
        const s = String(args.search).toLowerCase();
        leads = leads.filter((l: any) =>
          `${l.firstName ?? ""} ${l.lastName ?? ""}`.toLowerCase().includes(s) ||
          (l.email?.toLowerCase().includes(s)) ||
          (l.message?.toLowerCase().includes(s))
        );
      }
      return leads.slice(0, args.limit);
    } catch (error) {
      console.error('❌ list_leads error:', error);
      return { error: `Failed to fetch leads: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  }
};

export const listSessionsTool = {
  name: "list_sessions",
  description: "List photography sessions for the current studio. Optional filters.",
  parameters: z.object({
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(25),
    status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_SESSIONS");
    let sessions = await getSessionsForStudio(ctx.studioId);
    
    if (args.status) {
      sessions = sessions.filter((s: any) => s.status === args.status);
    }
    
    if (args.date_from) {
      const fromDate = new Date(args.date_from);
      sessions = sessions.filter((s: any) => new Date(s.sessionDate) >= fromDate);
    }
    
    if (args.date_to) {
      const toDate = new Date(args.date_to);
      sessions = sessions.filter((s: any) => new Date(s.sessionDate) <= toDate);
    }
    
    if (args.search) {
      const s = String(args.search).toLowerCase();
      sessions = sessions.filter((s: any) =>
        s.sessionType?.toLowerCase().includes(s) ||
        s.location?.toLowerCase().includes(s) ||
        s.notes?.toLowerCase().includes(s)
      );
    }
    
    return sessions.slice(0, args.limit);
  }
};

export const listInvoicesTool = {
  name: "list_invoices",
  description: "List invoices for the current studio. Optional filters.",
  parameters: z.object({
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(25),
    status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_INVOICES");
    let invoices = await getInvoicesForStudio(ctx.studioId);
    
    if (args.status) {
      invoices = invoices.filter((i: any) => i.status === args.status);
    }
    
    if (args.date_from) {
      const fromDate = new Date(args.date_from);
      invoices = invoices.filter((i: any) => new Date(i.createdAt) >= fromDate);
    }
    
    if (args.date_to) {
      const toDate = new Date(args.date_to);
      invoices = invoices.filter((i: any) => new Date(i.createdAt) <= toDate);
    }
    
    if (args.search) {
      const s = String(args.search).toLowerCase();
      invoices = invoices.filter((i: any) =>
        i.invoiceNumber?.toLowerCase().includes(s) ||
        i.clientName?.toLowerCase().includes(s)
      );
    }
    
    return invoices.slice(0, args.limit);
  }
};

// Removed duplicate client search tool - functionality merged into listClientsTool above

// Add missing count tools
export const countInvoicesTool = {
  name: "count_invoices",
  description: "Count invoices by month/year. If no year specified, defaults to current year (2025).",
  parameters: z.object({ 
    year: z.number().optional().default(2025), 
    month: z.number().optional() 
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      requireAuthority(ctx, "READ_INVOICES");
      let invoices = await getInvoicesForStudio(ctx.studioId);
      
      // Default to current year (2025) if no year specified
      const targetYear = args.year || 2025;
      
      if (targetYear || args.month) {
        invoices = invoices.filter((inv: any) => {
          // Handle different date field names from database
          const dateField = inv.issue_date || inv.issueDate || inv.created_at || inv.createdAt;
          if (!dateField) return false;
          
          const date = new Date(dateField);
          const matchYear = date.getFullYear() === targetYear;
          const matchMonth = !args.month || (date.getMonth() + 1) === args.month;
          return matchYear && matchMonth;
        });
      }
      
      return { count: invoices.length, year: targetYear };
    } catch (error) {
      console.error('❌ count_invoices error:', error);
      return { error: `Failed to count invoices: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  },
};

export const countSessionsTool = {
  name: "count_sessions",
  description: "Count photography sessions by year", 
  parameters: z.object({ 
    year: z.number().optional() 
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      requireAuthority(ctx, "READ_SESSIONS");
      let sessions = await getSessionsForStudio(ctx.studioId);
      
      if (args.year) {
        sessions = sessions.filter((sess: any) => {
          const date = new Date(sess.sessionDate || sess.session_date);
          return date.getFullYear() === args.year;
        });
      }
      
      return { count: sessions.length };
    } catch (error) {
      console.error('❌ count_sessions error:', error);
      return { error: `Failed to count sessions: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  },
};