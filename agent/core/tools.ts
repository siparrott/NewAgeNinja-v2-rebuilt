// Tool registration and management
import { createOpenAITool } from "../util/json-schema";
import { updateMemoryTool } from "../tools/update-memory";
import { sendEmailTool } from "../tools/send-email";
import { convertLeadTool } from "../tools/convert-lead";
import { reportLeadsTool } from "../tools/report-leads";

// Import all CRUD tools
import { readCrmLeads, createCrmLeads, updateCrmLeads } from "../tools/crm_leads";
import { readCrmClients, createCrmClients, updateCrmClients } from "../tools/crm_clients";
import { readCrmInvoices, createCrmInvoices, updateCrmInvoices } from "../tools/crm_invoices";
import { readPhotographySessions, createPhotographySessions, updatePhotographySessions } from "../tools/photography_sessions";
import { readGalleries, createGalleries, updateGalleries } from "../tools/galleries";
import { readBlogPosts, createBlogPosts, updateBlogPosts } from "../tools/blog_posts";
import { readEmailCampaigns, createEmailCampaigns, updateEmailCampaigns } from "../tools/email_campaigns";
import { analyzeWebsiteTool, getWebsiteProfileTool, suggestSiteImprovementsTool } from "../tools/website-tools";
// import { fixEmailAddressTool } from "../tools/fix-email-address";

export interface AgentTool {
  name: string;
  description: string;
  parameters: any; // Zod schema
  handler: (args: any, ctx: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  register(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  getOpenAITools() {
    return this.list().map(tool => createOpenAITool(tool.name, tool.description, tool.parameters));
  }
}

export const toolRegistry = new ToolRegistry();

// Register core tools
toolRegistry.register(updateMemoryTool);
toolRegistry.register(sendEmailTool);
toolRegistry.register(convertLeadTool);
toolRegistry.register(reportLeadsTool);
// toolRegistry.register(fixEmailAddressTool);  // Temporarily disabled due to schema error

// Register CRM read tools (CRITICAL FIX)
import { listClientsTool, listLeadsTool, listSessionsTool, listInvoicesTool, countInvoicesTool, countSessionsTool } from "../tools/crm-read";
import { lookupClientTool, searchCrmTool } from "../tools/crm-lookup";
import { globalSearchTool } from "../tools/global-search";

toolRegistry.register(listClientsTool);
toolRegistry.register(listLeadsTool);
toolRegistry.register(listSessionsTool);
toolRegistry.register(listInvoicesTool);
toolRegistry.register(countInvoicesTool);
toolRegistry.register(countSessionsTool);
toolRegistry.register(lookupClientTool);
toolRegistry.register(searchCrmTool);
toolRegistry.register(globalSearchTool);

// Register CRUD tools
const crudTools = [
  readCrmLeads, createCrmLeads, updateCrmLeads,
  readCrmClients, createCrmClients, updateCrmClients,
  readCrmInvoices, createCrmInvoices, updateCrmInvoices,
  readPhotographySessions, createPhotographySessions, updatePhotographySessions,
  readGalleries, createGalleries, updateGalleries,
  readBlogPosts, createBlogPosts, updateBlogPosts,
  readEmailCampaigns, createEmailCampaigns, updateEmailCampaigns
];

crudTools.forEach(tool => toolRegistry.register(tool));

// Register website analysis tools
toolRegistry.register(analyzeWebsiteTool);
toolRegistry.register(getWebsiteProfileTool);
toolRegistry.register(suggestSiteImprovementsTool);

// Register SEO and competitive intelligence tools
import {
  searchCompetitorsTool,
  fetchReviewsTool,
  keywordGapTool,
  checkDuplicateHeadlineTool,
  getSEOInsightsTool,
  trendingTopicsTool
} from "../tools/seo-tools";
import {
  refreshStudioContextTool,
  getStudioContextTool,
  getIntelligenceSummaryTool
} from "../tools/studio-context-tool";

toolRegistry.register(searchCompetitorsTool);
toolRegistry.register(fetchReviewsTool);
toolRegistry.register(keywordGapTool);
toolRegistry.register(checkDuplicateHeadlineTool);
toolRegistry.register(getSEOInsightsTool);
toolRegistry.register(trendingTopicsTool);
toolRegistry.register(refreshStudioContextTool);
toolRegistry.register(getStudioContextTool);
toolRegistry.register(getIntelligenceSummaryTool);