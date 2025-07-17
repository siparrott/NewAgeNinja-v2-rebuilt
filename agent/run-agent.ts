// Main agent runner for CLI testing
import { createAgentContext } from "./bootstrap";
import { createSystemPrompt } from "./prompts/system";
import { openaiForStudio } from "./core/openai";
import { toolRegistry } from "./core/tools";
import { createLogger } from "./util/logger";
import { logAgentAction } from "./core/audit";

const logger = createLogger("agent-runner");

export async function runAgent(studioId: string, userId: string, userMessage: string) {
  logger.info("Running agent", { studioId, userId, message: userMessage });
  
  try {
    // Bootstrap agent context
    const ctx = await createAgentContext(studioId, userId);
    
    // Create OpenAI client
    const openai = openaiForStudio(ctx.creds);
    
    // Create system prompt
    const systemPrompt = createSystemPrompt(ctx);
    
    // Get available tools
    const tools = toolRegistry.getOpenAITools();
    
    logger.info("Agent initialized", {
      mode: ctx.policy.mode,
      authorities: ctx.policy.authorities,
      toolsCount: tools.length,
    });
    
    // Create conversation
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const assistantMessage = response.choices[0].message;
    
    // Handle tool calls if any
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const tool = toolRegistry.get(toolCall.function.name);
        if (tool) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.handler(args, ctx);
            
            // Log the action
            await logAgentAction({
              studioId: ctx.studioId,
              userId: ctx.userId,
              action: toolCall.function.name,
              details: { args, result },
              timestamp: new Date(),
            });
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool" as const,
              content: JSON.stringify(result),
            });
          } catch (error) {
            logger.error("Tool execution failed", { tool: toolCall.function.name, error });
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool" as const,
              content: JSON.stringify({ error: error.message }),
            });
          }
        }
      }
      
      // Continue conversation with tool results
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          assistantMessage,
          ...toolResults,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      
      return finalResponse.choices[0].message.content;
    }
    
    return assistantMessage.content;
    
  } catch (error) {
    logger.error("Agent execution failed", error);
    throw error;
  }
}

// CLI Test runner
export async function runAgentCLI() {
  const defaultStudioId = "e5dc81e8-7073-4041-8814-affb60f4ef6c"; // New Age Fotografie
  const defaultUserId = "system"; // System user for testing
  
  const testMessage = "Give me a summary of our photography business pipeline for this month";
  
  try {
    const result = await runAgent(defaultStudioId, defaultUserId, testMessage);
    console.log("Agent Response:", result);
  } catch (error) {
    console.error("Agent test failed:", error);
  }
}