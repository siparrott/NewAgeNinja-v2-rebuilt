// Tool registration and management
import { createOpenAITool } from "../util/json-schema";
import { updateMemoryTool } from "../tools/update-memory";
import { convertLeadTool } from "../tools/convert-lead";
import { reportLeadsTool } from "../tools/report-leads";

// Import manual tools
import { readCrmLeads, createCrmLeads, updateCrmLeads } from "../tools/crm_leads";
import { readCrmClients, createCrmClients, updateCrmClients } from "../tools/crm_clients";
import { readCrmInvoices, createCrmInvoices, updateCrmInvoices } from "../tools/crm_invoices";
import { readPhotographySessions, createPhotographySessions, updatePhotographySessions } from "../tools/photography_sessions";
import { readGalleries, createGalleries, updateGalleries } from "../tools/galleries";
import { readBlogPosts, createBlogPosts, updateBlogPosts } from "../tools/blog_posts";
import { readEmailCampaigns, createEmailCampaigns, updateEmailCampaigns } from "../tools/email_campaigns";
import { analyzeWebsiteTool, getWebsiteProfileTool, suggestSiteImprovementsTool } from "../tools/website-tools";

// Auto-generated CRUD tools for all CRM tables
import { 
  readCrmClients as readCrmClientsAuto, 
  createCrmClients as createCrmClientsAuto, 
  updateCrmClients as updateCrmClientsAuto 
} from "../tools/crm_clients-auto";
import { readCrmInvoiceItems, createCrmInvoiceItems, updateCrmInvoiceItems } from "../tools/crm_invoice_items-auto";
import { readCrmInvoicePayments, createCrmInvoicePayments, updateCrmInvoicePayments } from "../tools/crm_invoice_payments-auto";
import { 
  readCrmInvoices as readCrmInvoicesAuto, 
  createCrmInvoices as createCrmInvoicesAuto, 
  updateCrmInvoices as updateCrmInvoicesAuto 
} from "../tools/crm_invoices-auto";
import { 
  readCrmLeads as readCrmLeadsAuto, 
  createCrmLeads as createCrmLeadsAuto, 
  updateCrmLeads as updateCrmLeadsAuto 
} from "../tools/crm_leads-auto";
import { readCrmMessages, createCrmMessages, updateCrmMessages } from "../tools/crm_messages-auto";

// Enhanced lead tools with proper error handling
import { readCrmLeads as readCrmLeadsEnhanced } from "../tools/read-crm-leads";
import { findLeadTool } from "../tools/find-lead";
import { enumerateLeadsTool } from "../tools/enumerate-leads";

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

// Import required tools
import { emailSendTool } from "../tools/email-send";
import { globalSearchTool } from "../tools/global-search";
import { findEntityTool } from "../tools/find-entity";
import { countInvoicesTool, countSessionsTool, countLeadsTool } from "../tools/count-tools";
import { createSessionTool } from "../tools/create-session";

// Register essential core tools only
toolRegistry.register(emailSendTool);
toolRegistry.register(globalSearchTool);
toolRegistry.register(findEntityTool);
toolRegistry.register(countInvoicesTool);
toolRegistry.register(countSessionsTool);
toolRegistry.register(countLeadsTool);
toolRegistry.register(createSessionTool);

// Add reply email tool for lead follow-up
import { replyEmailTool } from "../tools/reply-email";
toolRegistry.register(replyEmailTool);

// Add invoice creation tool
import { createInvoiceTool } from "../tools/create-invoice";
toolRegistry.register(createInvoiceTool);

// Add voucher management tools
import { createVoucherProductTool, sellVoucherTool, readVoucherSalesTool, redeemVoucherTool } from "../tools/voucher-management";
toolRegistry.register(createVoucherProductTool);
toolRegistry.register(sellVoucherTool);
toolRegistry.register(readVoucherSalesTool);
toolRegistry.register(redeemVoucherTool);

// Add top clients tools
import { listTopClientsTool, getClientSegmentsTool } from "../tools/top-clients";
toolRegistry.register(listTopClientsTool);
toolRegistry.register(getClientSegmentsTool);

// Minimal tool set to stay under token limit
console.log(`📋 Registered ${toolRegistry.list().length} tools for CRM agent`);

// Verify tool registration
toolRegistry.list().forEach(tool => {
  console.log(`✅ Tool registered: ${tool.name}`);
});