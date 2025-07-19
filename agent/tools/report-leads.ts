import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { AgentCtx } from "../core/ctx";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const reportLeadsTool = {
  name: "report_leads",
  description: "Generate lead analytics report",
  parameters: z.object({
    period: z.enum(["today", "week", "month", "quarter"]).default("week"),
    status: z.string().optional()
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      let dateFilter = new Date();
      
      switch (args.period) {
        case "today":
          dateFilter.setHours(0, 0, 0, 0);
          break;
        case "week":
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case "month":
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case "quarter":
          dateFilter.setMonth(dateFilter.getMonth() - 3);
          break;
      }

      let query = sb
        .from("crm_leads")
        .select("*")
        .eq("studio_id", ctx.studioId)
        .gte("created_at", dateFilter.toISOString());

      if (args.status) {
        query = query.eq("status", args.status);
      }

      const { data: leads, error } = await query;
      
      if (error) throw error;

      // Generate statistics
      const totalLeads = leads?.length || 0;
      const statusBreakdown = leads?.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const sourceBreakdown = leads?.reduce((acc, lead) => {
        const source = lead.source || "unknown";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        period: args.period,
        totalLeads,
        statusBreakdown,
        sourceBreakdown,
        leads: leads?.slice(0, 10) || [] // Show top 10 recent leads
      };
    } catch (error) {
      console.error("Lead report error:", error);
      throw new Error(`Failed to generate lead report: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
};