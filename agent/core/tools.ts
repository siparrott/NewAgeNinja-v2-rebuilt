// Tool registration and management
import { createOpenAITool } from "../util/json-schema.js";
import { updateMemoryTool } from "../tools/update-memory.js";
import { logInteractionTool } from "../tools/log-interaction.js";
import { convertLeadTool } from "../tools/convert-lead.js";
import { reportLeadsTool } from "../tools/report-leads.js";

// Import manual tools
import { readCrmLeads, createCrmLeads, updateCrmLeads } from "../tools/crm_leads.js";
import { readCrmClients, createCrmClients, updateCrmClients } from "../tools/crm_clients.js";
import { readCrmInvoices, createCrmInvoices, updateCrmInvoices } from "../tools/crm_invoices.js";
import { readPhotographySessions, createPhotographySessions, updatePhotographySessions } from "../tools/photography_sessions.js";
import { readGalleries, createGalleries, updateGalleries } from "../tools/galleries.js";
import { readBlogPosts, createBlogPosts, updateBlogPosts } from "../tools/blog_posts.js";
import { readEmailCampaigns, createEmailCampaigns, updateEmailCampaigns } from "../tools/email_campaigns.js";
import { analyzeWebsiteTool, getWebsiteProfileTool, suggestSiteImprovementsTool } from "../tools/website-tools.js";

// Auto-generated CRUD tools for all CRM tables
import { 
  readCrmClients as readCrmClientsAuto, 
  createCrmClients as createCrmClientsAuto, 
  updateCrmClients as updateCrmClientsAuto 
} from "../tools/crm_clients-auto.js";
import { readCrmInvoiceItems, createCrmInvoiceItems, updateCrmInvoiceItems } from "../tools/crm_invoice_items-auto.js";
import { readCrmInvoicePayments, createCrmInvoicePayments, updateCrmInvoicePayments } from "../tools/crm_invoice_payments-auto.js";
import { 
  readCrmInvoices as readCrmInvoicesAuto, 
  createCrmInvoices as createCrmInvoicesAuto, 
  updateCrmInvoices as updateCrmInvoicesAuto 
} from "../tools/crm_invoices-auto.js";
import { 
  readCrmLeads as readCrmLeadsAuto, 
  createCrmLeads as createCrmLeadsAuto, 
  updateCrmLeads as updateCrmLeadsAuto 
} from "../tools/crm_leads-auto.js";
import { readCrmMessages, createCrmMessages, updateCrmMessages } from "../tools/crm_messages-auto.js";

// Enhanced lead tools with proper error handling
import { readCrmLeads as readCrmLeadsEnhanced } from "../tools/read-crm-leads.js";
import { findLeadTool } from "../tools/find-lead.js";
import { enumerateLeadsTool } from "../tools/enumerate-leads.js";
import { listLeadsTool } from "../tools/list-leads.js";

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

  keys(): string[] {
    return Array.from(this.tools.keys());
  }

  getOpenAITools() {
    return this.list().map(tool => createOpenAITool(tool.name, tool.description, tool.parameters));
  }
}

export const toolRegistry = new ToolRegistry();

// Import required tools
import { emailSendTool } from "../tools/email-send.js";
import { draftEmailTool } from "../tools/draft-email.js";
import { emailAnalysisTool, monitorEmailsTool, autoReplyTool } from "../tools/email-monitoring.js";
import { websiteScraperTool } from "../tools/website-scraper.js";
import { globalSearchTool } from "../tools/global-search.js";
import { findEntityTool } from "../tools/find-entity.js";
import { countInvoicesTool, countSessionsTool, countLeadsTool } from "../tools/count-tools.js";
import { createGalleryCheckoutTool } from "../tools/create-stripe-checkout.js";
import { submitProdigiOrderTool } from "../tools/submit-prodigi-order.js";
// import { galleryTools } from "../tools/gallery-management.js"; // Temporarily disabled due to import issues
import { calendarTools } from "../tools/calendar-management.js";
import { fileManagementTools } from "../tools/file-management.js";
import { blogManagementTools } from "../tools/blog-management.js";
import { emailCampaignTools } from "../tools/email-campaign-management.js";
import { questionnaireTools } from "../tools/questionnaire-management.js";
import { reportsAnalyticsTools } from "../tools/reports-analytics.js";
import { systemAdministrationTools } from "../tools/system-administration.js";
import { integrationManagementTools } from "../tools/integration-management.js";
import { automationManagementTools } from "../tools/automation-management.js";
import { customerPortalManagementTools } from "../tools/customer-portal-management.js";

// Register essential core tools only
toolRegistry.register(emailSendTool);
toolRegistry.register(draftEmailTool);

// Register email monitoring and intelligence tools
toolRegistry.register({
  name: emailAnalysisTool.name,
  description: emailAnalysisTool.description,
  parameters: emailAnalysisTool.parameters,
  handler: async (params) => emailAnalysisTool.execute(params)
});
toolRegistry.register({
  name: monitorEmailsTool.name,
  description: monitorEmailsTool.description,
  parameters: monitorEmailsTool.parameters,
  handler: async (params) => monitorEmailsTool.execute(params)
});
toolRegistry.register({
  name: autoReplyTool.name,
  description: autoReplyTool.description,
  parameters: autoReplyTool.parameters,
  handler: async (params) => autoReplyTool.execute(params)
});

// Register website analysis tool
toolRegistry.register({
  name: websiteScraperTool.name,
  description: websiteScraperTool.description,
  parameters: websiteScraperTool.parameters,
  handler: async (params) => websiteScraperTool.execute(params)
});
toolRegistry.register(globalSearchTool);
toolRegistry.register(findEntityTool);
toolRegistry.register(countInvoicesTool);
toolRegistry.register(countSessionsTool);
toolRegistry.register(countLeadsTool);
toolRegistry.register(createGalleryCheckoutTool);
toolRegistry.register(submitProdigiOrderTool);
// Register calendar management tools
calendarTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register file management tools
fileManagementTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register blog management tools
blogManagementTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register email campaign management tools
emailCampaignTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register questionnaire management tools
questionnaireTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register reports & analytics tools
reportsAnalyticsTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register system administration tools
systemAdministrationTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register integration management tools
integrationManagementTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register automation management tools
automationManagementTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Register customer portal management tools
customerPortalManagementTools.forEach(tool => {
  toolRegistry.register({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: async (params) => tool.execute(params)
  });
});

// Add reply email tool for lead follow-up
import { replyEmailTool } from "../tools/reply-email.js";
toolRegistry.register(replyEmailTool);

// Add invoice creation tool
import { createInvoiceTool } from "../tools/create-invoice.js";
toolRegistry.register(createInvoiceTool);

// Add planning and knowledge tools
import { describeCapabilitiesTool } from "../tools/describe-capabilities.js";
import { kbSearchTool } from "../tools/kb-search.js";
toolRegistry.register(describeCapabilitiesTool);
toolRegistry.register(kbSearchTool);

// Add voucher management tools
import { createVoucherProductTool, sellVoucherTool, readVoucherSalesTool, redeemVoucherTool } from "../tools/voucher-management.js";
toolRegistry.register(createVoucherProductTool);
toolRegistry.register(sellVoucherTool);
toolRegistry.register(readVoucherSalesTool);
toolRegistry.register(redeemVoucherTool);

// Add top clients tools
import { listTopClientsTool, getClientSegmentsTool } from "../tools/top-clients.js";
toolRegistry.register(listTopClientsTool);
toolRegistry.register(getClientSegmentsTool);

// Add log interaction tool
toolRegistry.register(logInteractionTool);

// Add user-friendly list leads tool
toolRegistry.register(listLeadsTool);

// Add gallery management tools - temporarily disabled due to import issues
// galleryTools.forEach(tool => {
//   toolRegistry.register({
//     name: tool.name,
//     description: tool.description,
//     parameters: tool.parameters,
//     handler: async (params) => tool.execute(params)
//   });
// });

// Minimal tool set to stay under token limit
console.log(`📋 Registered ${toolRegistry.list().length} tools for CRM agent`);

// Verify tool registration
toolRegistry.list().forEach(tool => {
  console.log(`✅ Tool registered: ${tool.name}`);
});