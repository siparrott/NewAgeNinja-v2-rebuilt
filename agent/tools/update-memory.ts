import { z } from "zod";
import type { AgentCtx } from "../core/ctx";

export const updateMemoryTool = {
  name: "update_memory",
  description: "Update working memory for this chat session with a PATCH operation. Only modify fields that changed.",
  parameters: z.object({
    current_goal: z.string().optional().describe("Current task or goal the user is working on"),
    selected_client_id: z.string().optional().describe("ID of currently selected client"),
    selected_session_id: z.string().optional().describe("ID of currently selected photography session"),
    pending_proposals: z.array(z.object({
      id: z.string(),
      tool: z.string(),
      args: z.record(z.any()),
      reason: z.string()
    })).optional().describe("Proposals awaiting user approval"),
    user_prefs: z.object({
      language: z.enum(["de", "en"]).optional(),
      currency: z.string().optional(),
      default_package: z.string().optional(),
      preferred_days: z.string().optional(),
      communication_style: z.string().optional()
    }).optional().describe("User preferences and settings"),
    notes: z.array(z.string()).optional().describe("Short contextual notes about the user or session")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    // Store memory in session context (could be enhanced with persistent storage)
    if (!ctx.session_memory) {
      ctx.session_memory = {};
    }
    
    // Apply PATCH operation - only update provided fields
    Object.keys(args).forEach(key => {
      if (args[key] !== undefined) {
        if (key === 'notes' && ctx.session_memory.notes) {
          // Append to existing notes instead of replacing
          ctx.session_memory.notes = [...ctx.session_memory.notes, ...args[key]];
        } else if (key === 'user_prefs' && ctx.session_memory.user_prefs) {
          // Merge user preferences
          ctx.session_memory.user_prefs = { ...ctx.session_memory.user_prefs, ...args[key] };
        } else {
          ctx.session_memory[key] = args[key];
        }
      }
    });
    
    return {
      status: 'success',
      message: 'Working memory updated successfully',
      updated_fields: Object.keys(args).filter(key => args[key] !== undefined)
    };
  }
};