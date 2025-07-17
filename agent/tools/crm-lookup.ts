import { z } from "zod";
import type { AgentCtx } from "../core/ctx";
import { requireAuthority } from "../core/authz";
import { getClientsForStudio, getLeadsForStudio, getSessionsForStudio, getInvoicesForStudio } from "../integrations/crm-data";

export const lookupClientTool = {
  name: "lookup_client",
  description: "Look up detailed information about a specific client by ID or email.",
  parameters: z.object({
    clientId: z.string().optional(),
    email: z.string().email().optional(),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    
    if (!args.clientId && !args.email) {
      throw new Error("Either clientId or email must be provided");
    }
    
    const clients = await getClientsForStudio(ctx.studioId);
    const client = clients.find((c: any) => 
      (args.clientId && c.id === args.clientId) ||
      (args.email && c.email === args.email)
    );
    
    if (!client) {
      return { error: "Client not found" };
    }
    
    // Get related data
    const [sessions, invoices] = await Promise.all([
      getSessionsForStudio(ctx.studioId),
      getInvoicesForStudio(ctx.studioId),
    ]);
    
    const clientSessions = sessions.filter((s: any) => s.clientId === client.id);
    const clientInvoices = invoices.filter((i: any) => i.clientId === client.id);
    
    const totalSpent = clientInvoices
      .filter((i: any) => i.status === "paid")
      .reduce((sum: number, i: any) => sum + (parseFloat(i.totalAmount) || 0), 0);
    
    const pendingAmount = clientInvoices
      .filter((i: any) => i.status === "sent")
      .reduce((sum: number, i: any) => sum + (parseFloat(i.totalAmount) || 0), 0);
    
    return {
      client,
      summary: {
        totalSessions: clientSessions.length,
        totalInvoices: clientInvoices.length,
        totalSpent: `€${totalSpent.toFixed(2)}`,
        pendingAmount: `€${pendingAmount.toFixed(2)}`,
        lastSession: clientSessions.length > 0 
          ? clientSessions.sort((a: any, b: any) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())[0]
          : null,
      },
      recentSessions: clientSessions
        .sort((a: any, b: any) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
        .slice(0, 5),
      recentInvoices: clientInvoices
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    };
  }
};

export const searchCrmTool = {
  name: "search_crm",
  description: "Search across all CRM data (clients, leads, sessions, invoices) with a single query.",
  parameters: z.object({
    query: z.string().min(1, "Search query is required"),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    requireAuthority(ctx, "READ_LEADS");
    requireAuthority(ctx, "READ_SESSIONS");
    requireAuthority(ctx, "READ_INVOICES");
    
    const query = args.query.toLowerCase();
    
    const [clients, leads, sessions, invoices] = await Promise.all([
      getClientsForStudio(ctx.studioId),
      getLeadsForStudio(ctx.studioId),
      getSessionsForStudio(ctx.studioId),
      getInvoicesForStudio(ctx.studioId),
    ]);
    
    const results = {
      clients: clients.filter((c: any) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query)
      ).slice(0, args.limit),
      
      leads: leads.filter((l: any) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query) ||
        l.phone?.toLowerCase().includes(query) ||
        l.message?.toLowerCase().includes(query)
      ).slice(0, args.limit),
      
      sessions: sessions.filter((s: any) =>
        s.sessionType?.toLowerCase().includes(query) ||
        s.location?.toLowerCase().includes(query) ||
        s.notes?.toLowerCase().includes(query)
      ).slice(0, args.limit),
      
      invoices: invoices.filter((i: any) =>
        i.invoiceNumber?.toLowerCase().includes(query) ||
        i.clientName?.toLowerCase().includes(query) ||
        i.description?.toLowerCase().includes(query)
      ).slice(0, args.limit),
    };
    
    const totalResults = results.clients.length + results.leads.length + 
                        results.sessions.length + results.invoices.length;
    
    return {
      query: args.query,
      totalResults,
      results,
      summary: {
        clients: results.clients.length,
        leads: results.leads.length,
        sessions: results.sessions.length,
        invoices: results.invoices.length,
      }
    };
  }
};