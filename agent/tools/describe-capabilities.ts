import { z } from "zod";
import { readFileSync } from "fs";
import type { AgentCtx } from "../core/ctx.js";

export const describeCapabilitiesTool = {
  name: "describe_capabilities",
  description: "Get comprehensive list of all available CRM tools and their capabilities. Use this when unsure which tools to use for a complex request.",
  parameters: z.object({
    category: z.string().optional().describe("Optional: filter by category (communication, billing, scheduling, content, files, search, crm, analytics, admin, automation, portal, products)")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      const catalogPath = "agent/data/tool_catalog.json";
      const catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));
      
      let tools = catalog.tools;
      
      // Filter by category if specified
      if (args.category) {
        tools = tools.filter((tool: any) => tool.category === args.category);
      }
      
      return {
        total_tools: catalog.total_tools,
        available_categories: catalog.categories,
        filtered_category: args.category || "all",
        tools: tools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          key_parameters: Object.keys(tool.parameters)
        }))
      };
      
    } catch (error) {
      console.error('❌ describe_capabilities error:', error);
      return {
        error: "Tool catalog not found. Run 'npm run gen:catalog' to generate it.",
        available_tools: Object.keys(require("../core/tools").toolRegistry)
      };
    }
  }
};