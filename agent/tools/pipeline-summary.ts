import { z } from "zod";
import type { AgentCtx } from "../core/ctx";
import { requireAuthority } from "../core/authz";
import { getClientsForStudio, getLeadsForStudio, getSessionsForStudio, getInvoicesForStudio } from "../integrations/crm-data";

export const pipelineSummaryTool = {
  name: "pipeline_summary",
  description: "Get a comprehensive summary of the CRM pipeline with key metrics and insights.",
  parameters: z.object({
    period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_CLIENTS");
    requireAuthority(ctx, "READ_LEADS");
    requireAuthority(ctx, "READ_SESSIONS");
    requireAuthority(ctx, "READ_INVOICES");

    const [clients, leads, sessions, invoices] = await Promise.all([
      getClientsForStudio(ctx.studioId),
      getLeadsForStudio(ctx.studioId),
      getSessionsForStudio(ctx.studioId),
      getInvoicesForStudio(ctx.studioId),
    ]);

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (args.period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Filter data by period
    const recentLeads = leads.filter((l: any) => new Date(l.createdAt) >= startDate);
    const recentSessions = sessions.filter((s: any) => new Date(s.sessionDate) >= startDate);
    const recentInvoices = invoices.filter((i: any) => new Date(i.createdAt) >= startDate);

    // Calculate metrics
    const totalRevenue = recentInvoices
      .filter((i: any) => i.status === "paid")
      .reduce((sum: number, i: any) => sum + (parseFloat(i.totalAmount) || 0), 0);

    const pendingRevenue = recentInvoices
      .filter((i: any) => i.status === "sent")
      .reduce((sum: number, i: any) => sum + (parseFloat(i.totalAmount) || 0), 0);

    const leadsByStatus = recentLeads.reduce((acc: any, lead: any) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const sessionsByStatus = recentSessions.reduce((acc: any, session: any) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {});

    const invoicesByStatus = recentInvoices.reduce((acc: any, invoice: any) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});

    // Conversion metrics
    const conversionRate = recentLeads.length > 0 
      ? (recentSessions.length / recentLeads.length * 100).toFixed(1)
      : "0.0";

    const avgOrderValue = recentInvoices.length > 0 
      ? (totalRevenue / recentInvoices.filter((i: any) => i.status === "paid").length).toFixed(2)
      : "0.00";

    return {
      period: args.period,
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      },
      summary: {
        totalClients: clients.length,
        totalLeads: recentLeads.length,
        totalSessions: recentSessions.length,
        totalInvoices: recentInvoices.length,
        totalRevenue: `€${totalRevenue.toFixed(2)}`,
        pendingRevenue: `€${pendingRevenue.toFixed(2)}`,
        conversionRate: `${conversionRate}%`,
        avgOrderValue: `€${avgOrderValue}`,
      },
      breakdown: {
        leadsByStatus,
        sessionsByStatus,
        invoicesByStatus,
      },
      insights: [
        `You have ${recentLeads.length} new leads in the last ${args.period}`,
        `${recentSessions.length} sessions scheduled/completed`,
        `€${totalRevenue.toFixed(2)} revenue generated`,
        `${conversionRate}% lead-to-session conversion rate`,
        `Average order value: €${avgOrderValue}`,
      ],
    };
  }
};