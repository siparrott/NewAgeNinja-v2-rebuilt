// Main agent runner
import { createAgentContext } from "./bootstrap";
import { toolRegistry } from "./core/tools";
import { runLLM } from "./llm/run";

const SYSTEM_PROMPT = `You are {{STUDIO_NAME}}'s CRM Operations Assistant in TogNinja.

POLICY
- mode: {{POLICY_MODE}}
- authorities: {{POLICY_AUTHORITIES_CSV}}
- approval_limit: {{POLICY_AMOUNT_LIMIT}} {{STUDIO_CURRENCY}}

MEMORY
You receive [[WORKING_MEMORY]] JSON. Use silently.  
Call the update_memory tool when goals / selections change.

SEARCH-FIRST BEHAVIOR
• Before answering any user question about data ("how many…", "does X exist…", "send invoice…") you MUST call the most relevant read/count tool.
    – If you know the exact table → call that read/count tool.
    – If you are unsure which table contains the info → call global_search(term).
• Never rely solely on working memory or previous messages for factual data.
• After receiving tool output, decide next action (draft email, propose invoice, etc.) and respond.

TOOLS
(list supplied automatically)

RULES
- Use the most specific tool.  
- For writes needing approval, respond with \`proposed_actions\` JSON.  
- Confirm success when tool returns status=created/updated.

Tone: founder-led, no-BS, Sabri Suby style.`;

export async function runAgent(studioId: string, userId: string, message: string): Promise<string> {
  try {
    // Create agent context
    const ctx = await createAgentContext(studioId, userId);
    
    // Prepare system prompt with context
    let systemPrompt = SYSTEM_PROMPT
      .replace('{{STUDIO_NAME}}', ctx.studioName)
      .replace('{{POLICY_MODE}}', ctx.policy.mode)
      .replace('{{POLICY_AUTHORITIES_CSV}}', ctx.policy.authorities.join(', '))
      .replace('{{POLICY_AMOUNT_LIMIT}}', ctx.policy.approval_required_over_amount.toString())
      .replace('{{STUDIO_CURRENCY}}', ctx.creds.currency)
      .replace('[[WORKING_MEMORY]]', JSON.stringify(ctx.memory));

    // Get available tools
    const tools = toolRegistry.getOpenAITools();

    // Prepare messages
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    // Run LLM
    const completion = await runLLM(messages, tools);
    
    // Handle tool calls if present
    const assistantMessage = completion.choices[0]?.message;
    
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Execute tools
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const tool = toolRegistry.get(toolCall.function.name);
          if (tool) {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.handler(args, ctx);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify(result)
            });
          } else {
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool", 
              content: JSON.stringify({ error: "Tool not found" })
            });
          }
        } catch (error) {
          console.error(`❌ Tool execution error for ${toolCall.function.name}:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ error: error instanceof Error ? error.message : "Tool execution failed" })
          });
        }
      }

      // Get final response with tool results
      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolResults
      ];

      const finalCompletion = await runLLM(finalMessages, tools);
      return finalCompletion.choices[0]?.message?.content || "I apologize, but I couldn't complete that task.";
    }

    return assistantMessage?.content || "I apologize, but I couldn't generate a response.";
    
  } catch (error) {
    console.error("Agent execution error:", error);
    throw new Error(`Agent failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}