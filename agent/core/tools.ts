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