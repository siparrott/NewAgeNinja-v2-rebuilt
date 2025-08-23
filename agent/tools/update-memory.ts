import { z } from "zod";
import { updateSession, type WorkingMemory } from "../core/memory.js";
import type { AgentCtx } from "../core/ctx.js";

export const updateMemoryTool = {
  name: "update_memory",
  description: "Update working memory with context, goals, and preferences",
  parameters: z.object({
    selectedClientId: z.string().optional(),
    currentGoal: z.string().optional(),
    preferences: z.record(z.any()).optional(),
    context: z.record(z.any()).optional()
  }),
  handler: async (args: any, ctx: AgentCtx & { chatSessionId: string }) => {
    try {
      const memoryUpdate: WorkingMemory = {
        selectedClientId: args.selectedClientId,
        currentGoal: args.currentGoal,
        preferences: args.preferences,
        context: args.context
      };

      // Filter out undefined values
      const cleanedUpdate = Object.fromEntries(
        Object.entries(memoryUpdate).filter(([_, value]) => value !== undefined)
      );

      await updateSession(ctx.chatSessionId, cleanedUpdate);

      return {
        success: true,
        updated: Object.keys(cleanedUpdate),
        message: "Memory updated successfully"
      };
    } catch (error) {
      console.error("Memory update error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update memory"
      };
    }
  }
};