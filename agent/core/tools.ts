// Tool registration and management
import { createOpenAITool } from "../util/json-schema";
import { listClientsTool, listLeadsTool, listSessionsTool, listInvoicesTool } from "../tools/crm-read";
import { pipelineSummaryTool } from "../tools/pipeline-summary";
import { draftEmailTool } from "../tools/email-draft";
import { lookupClientTool, searchCrmTool } from "../tools/crm-lookup";

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

// Register all available tools
toolRegistry.register(listClientsTool);
toolRegistry.register(listLeadsTool);
toolRegistry.register(listSessionsTool);
toolRegistry.register(listInvoicesTool);
toolRegistry.register(pipelineSummaryTool);
toolRegistry.register(draftEmailTool);
toolRegistry.register(lookupClientTool);
toolRegistry.register(searchCrmTool);