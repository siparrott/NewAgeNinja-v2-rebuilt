import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx.js";
import { allowWrite } from "../core/guardrails.js";

const sql = neon(process.env.DATABASE_URL!);

// Simple authority check for top clients
function requireAuthority(ctx: AgentCtx, authority: string) {
  const result = allowWrite(ctx, authority);
  if (result !== "allow") {
    throw new Error(`Authorization denied: ${authority}`);
  }
}

export const listTopClientsTool = {
  name: "list_top_clients",
  description: "Get top clients ranked by lifetime value, revenue, or other criteria",
  parameters: z.object({
    limit: z.number().default(10),
    orderBy: z.enum(["lifetime_value", "total_revenue", "session_count", "recent_activity"]).default("lifetime_value"),
    minRevenue: z.number().optional(),
    yearFilter: z.number().optional()
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_TOP_CLIENTS");
    
    try {
      let query = `
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.city,
          COALESCE(SUM(i.total), 0) as total_revenue,
          COUNT(DISTINCT i.id) as invoice_count,
          COUNT(DISTINCT s.id) as session_count,
          MAX(i.created_at) as last_invoice_date,
          MAX(s.session_date) as last_session_date,
          COALESCE(SUM(i.total), 0) as lifetime_value
        FROM crm_clients c
        LEFT JOIN crm_invoices i ON c.id = i.client_id AND i.status = 'PAID'
        LEFT JOIN photography_sessions s ON c.id::text = s.client_id
      `;
      
      // Add year filter if specified
      if (args.yearFilter) {
        query += ` AND EXTRACT(YEAR FROM i.created_at) = ${args.yearFilter}`;
      }
      
      query += ` GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.city`;
      
      // Add minimum revenue filter
      if (args.minRevenue) {
        query += ` HAVING SUM(i.total) >= ${args.minRevenue}`;
      }
      
      // Add ordering
      switch (args.orderBy) {
        case "total_revenue":
        case "lifetime_value":
          query += ` ORDER BY total_revenue DESC`;
          break;
        case "session_count":
          query += ` ORDER BY session_count DESC`;
          break;
        case "recent_activity":
          query += ` ORDER BY GREATEST(COALESCE(last_invoice_date, '1900-01-01'), COALESCE(last_session_date, '1900-01-01')) DESC`;
          break;
      }
      
      query += ` LIMIT ${args.limit}`;
      
      const result = await sql(query);
      
      // Calculate additional metrics
      const topClients = result.map((client: any) => ({
        ...client,
        total_revenue: parseFloat(client.total_revenue || 0),
        lifetime_value: parseFloat(client.lifetime_value || 0),
        average_invoice: client.invoice_count > 0 ? (parseFloat(client.total_revenue || 0) / client.invoice_count) : 0,
        client_since: client.last_session_date || client.last_invoice_date,
        rank_by: args.orderBy
      }));
      
      return {
        success: true,
        topClients,
        count: topClients.length,
        criteria: args.orderBy,
        totalRevenue: topClients.reduce((sum, client) => sum + client.total_revenue, 0),
        message: `Successfully retrieved ${topClients.length} top clients ranked by ${args.orderBy}. Total combined revenue: €${topClients.reduce((sum, client) => sum + client.total_revenue, 0).toFixed(2)}.`,
        summary: topClients.length > 0 ? 
          `Top client: ${topClients[0].first_name} ${topClients[0].last_name} (€${topClients[0].total_revenue.toFixed(2)})` : 
          "No clients found matching criteria"
      };
    } catch (error) {
      console.error('❌ list_top_clients error:', error);
      throw new Error(`Failed to list top clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const getClientSegmentsTool = {
  name: "get_client_segments",
  description: "Analyze client segments and provide segmentation insights",
  parameters: z.object({
    segmentBy: z.enum(["revenue", "frequency", "recency", "geography"]).default("revenue"),
    includeStats: z.boolean().default(true)
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "READ_TOP_CLIENTS");
    
    try {
      let segmentQuery = "";
      
      switch (args.segmentBy) {
        case "revenue":
          segmentQuery = `
            SELECT 
              CASE 
                WHEN total_revenue >= 1000 THEN 'VIP (€1000+)'
                WHEN total_revenue >= 500 THEN 'Premium (€500-999)'
                WHEN total_revenue >= 200 THEN 'Standard (€200-499)'
                WHEN total_revenue > 0 THEN 'Basic (€1-199)'
                ELSE 'No Revenue'
              END as segment,
              COUNT(*) as client_count,
              SUM(total_revenue) as segment_revenue,
              AVG(total_revenue) as avg_revenue_per_client
            FROM (
              SELECT 
                c.id,
                COALESCE(SUM(i.total), 0) as total_revenue
              FROM crm_clients c
              LEFT JOIN crm_invoices i ON c.id = i.client_id AND i.status = 'PAID'
              GROUP BY c.id
            ) client_revenues
            GROUP BY segment
            ORDER BY segment_revenue DESC
          `;
          break;
          
        case "frequency":
          segmentQuery = `
            SELECT 
              CASE 
                WHEN session_count >= 5 THEN 'Frequent (5+ sessions)'
                WHEN session_count >= 3 THEN 'Regular (3-4 sessions)'
                WHEN session_count >= 1 THEN 'Occasional (1-2 sessions)'
                ELSE 'No Sessions'
              END as segment,
              COUNT(*) as client_count,
              SUM(session_count) as total_sessions,
              AVG(session_count) as avg_sessions_per_client
            FROM (
              SELECT 
                c.id,
                COUNT(s.id) as session_count
              FROM crm_clients c
              LEFT JOIN photography_sessions s ON c.id::text = s.client_id
              GROUP BY c.id
            ) client_sessions
            GROUP BY segment
            ORDER BY total_sessions DESC
          `;
          break;
          
        case "geography":
          segmentQuery = `
            SELECT 
              COALESCE(city, 'Unknown') as segment,
              COUNT(*) as client_count,
              COALESCE(SUM(total_revenue), 0) as segment_revenue
            FROM (
              SELECT 
                c.city,
                COALESCE(SUM(i.total), 0) as total_revenue
              FROM crm_clients c
              LEFT JOIN crm_invoices i ON c.id = i.client_id AND i.status = 'PAID'
              GROUP BY c.id, c.city
            ) client_geo
            GROUP BY city
            ORDER BY client_count DESC
            LIMIT 10
          `;
          break;
      }
      
      const segments = await sql(segmentQuery);
      
      return {
        success: true,
        segments,
        segmentBy: args.segmentBy,
        totalSegments: segments.length,
        message: `Client segmentation analysis completed successfully. Found ${segments.length} ${args.segmentBy} segments with detailed breakdown.`,
        insights: segments.length > 0 ? 
          `Largest segment: ${segments[0].segment} with ${segments[0].client_count} clients` : 
          "No segments found for analysis"
      };
    } catch (error) {
      console.error('❌ get_client_segments error:', error);
      throw new Error(`Failed to get client segments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};