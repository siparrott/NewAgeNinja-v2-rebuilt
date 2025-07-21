import { AgentTool } from "../core/tools";
import { auditLog } from "../core/audit";

/**
 * Log user interactions and conversation context
 */
export const logInteractionTool: AgentTool = {
  name: "log_interaction",
  description: "Log user interactions and conversation context for memory and audit trail",
  parameters: {
    type: "object",
    properties: {
      interaction_type: {
        type: "string",
        description: "Type of interaction (greeting, request, response, etc.)",
        enum: ["greeting", "request", "response", "task_completion", "error", "follow_up"]
      },
      user_message: {
        type: "string",
        description: "The user's message or interaction content"
      },
      context: {
        type: "object",
        description: "Additional context about the interaction",
        properties: {
          user_id: { type: "string" },
          session_id: { type: "string" },
          timestamp: { type: "string" },
          metadata: { type: "object" }
        }
      },
      response_summary: {
        type: "string",
        description: "Summary of the agent's response or action taken"
      }
    },
    required: ["interaction_type", "user_message"]
  },
  async handler(args: any, ctx: any) {
    try {
      // Log the interaction using the audit system
      await auditLog({
        studio_id: ctx.studioId,
        user_id: ctx.userId,
        action: `interaction_${args.interaction_type}`,
        target_table: "conversations",
        status: "executed",
        metadata: {
          interaction_type: args.interaction_type,
          user_message: args.user_message,
          response_summary: args.response_summary,
          context: args.context,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`💬 Interaction logged: ${args.interaction_type}`, {
        studioId: ctx.studioId,
        userId: ctx.userId,
        type: args.interaction_type
      });

      return {
        success: true,
        message: `Interaction logged successfully: ${args.interaction_type}`,
        logged_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to log interaction:', error);
      return {
        success: false,
        error: `Failed to log interaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};