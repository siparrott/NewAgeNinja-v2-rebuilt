import { z } from "zod";
import { rebuildStudioContext, getStudioContext, getStudioIntelligenceSummary } from "../integrations/studio-context.js";
import type { AgentCtx } from "../core/ctx.js";

/* refresh_studio_context */
export const refreshStudioContextTool = {
  name: "refresh_studio_context",
  description: "Rebuild and refresh the studio's global context cache including brand information, colors, keywords, and performance data from recent website and SEO analysis.",
  parameters: z.object({}),
  handler: async (_: any, ctx: AgentCtx) => {
    try {
      const contextJson = await rebuildStudioContext(ctx.studioId);
      
      return {
        status: "refreshed",
        context: contextJson,
        message: "Studio context successfully updated with latest data"
      };
    } catch (error) {
      console.error('Error refreshing studio context:', error);
      return { 
        error: "refresh-failed", 
        message: error instanceof Error ? error.message : "Failed to refresh context" 
      };
    }
  }
};

/* get_studio_context */
export const getStudioContextTool = {
  name: "get_studio_context",
  description: "Get the cached studio context including brand title, description, colors, keywords, and performance metrics.",
  parameters: z.object({}),
  handler: async (_: any, ctx: AgentCtx) => {
    try {
      const context = await getStudioContext(ctx.studioId);
      
      return {
        context,
        has_data: Object.keys(context).length > 0,
        last_refresh: context.last_refresh || null
      };
    } catch (error) {
      console.error('Error getting studio context:', error);
      return { 
        error: "fetch-failed", 
        message: error instanceof Error ? error.message : "Failed to get context" 
      };
    }
  }
};

/* get_intelligence_summary */
export const getIntelligenceSummaryTool = {
  name: "get_intelligence_summary",
  description: "Get a comprehensive intelligence summary combining website analysis, SEO data, brand context, and recent discoveries.",
  parameters: z.object({}),
  handler: async (_: any, ctx: AgentCtx) => {
    try {
      const summary = await getStudioIntelligenceSummary(ctx.studioId);
      
      if (!summary) {
        return {
          status: "no-data",
          message: "No intelligence data available. Run website analysis and SEO research first."
        };
      }
      
      return {
        status: "available",
        summary,
        data_sources: {
          website_analyzed: !!summary.website_analysis?.title,
          seo_research: summary.recent_seo_queries.length > 0,
          brand_context: Object.keys(summary.brand_context).length > 0
        }
      };
    } catch (error) {
      console.error('Error getting intelligence summary:', error);
      return { 
        error: "summary-failed", 
        message: error instanceof Error ? error.message : "Failed to get intelligence summary" 
      };
    }
  }
};