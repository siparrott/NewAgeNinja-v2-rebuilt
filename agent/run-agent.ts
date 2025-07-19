// Main agent runner
import { createAgentContext } from "./bootstrap";
import { toolRegistry } from "./core/tools";
import { runLLM } from "./llm/run";
import { addMessageToHistory, getConversationHistory, updateSession } from "./core/memory";

const SYSTEM_PROMPT = `You are {{STUDIO_NAME}}'s CRM Operations Assistant in TogNinja.

POLICY
- mode: {{POLICY_MODE}}
- authorities: {{POLICY_AUTHORITIES_CSV}}
- approval_limit: {{POLICY_AMOUNT_LIMIT}} {{STUDIO_CURRENCY}}

MEMORY & CONVERSATION CONTEXT
You receive [[WORKING_MEMORY]] JSON. Use silently.  
You have access to previous conversation history - acknowledge returning users and reference past interactions.
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
    
    // Load conversation history
    const conversationHistory = await getConversationHistory(ctx.chatSessionId);
    
    // Add greeting for new users and maintain context
    let enhancedMemory = { ...ctx.memory };
    if (conversationHistory.length === 0) {
      enhancedMemory.userName = "business owner";
      enhancedMemory.context = { 
        isFirstInteraction: true,
        greeting: "This is our first conversation today" 
      };
    } else {
      enhancedMemory.context = {
        isReturningUser: true,
        previousInteractions: conversationHistory.length,
        lastSeen: enhancedMemory.lastInteraction,
        userName: enhancedMemory.userName || "business owner"
      };
    }
    
    // Prepare system prompt with enhanced context
    let systemPrompt = SYSTEM_PROMPT
      .replace('{{STUDIO_NAME}}', ctx.studioName)
      .replace('{{POLICY_MODE}}', ctx.policy.mode)
      .replace('{{POLICY_AUTHORITIES_CSV}}', ctx.policy.authorities.join(', '))
      .replace('{{POLICY_AMOUNT_LIMIT}}', ctx.policy.approval_required_over_amount.toString())
      .replace('{{STUDIO_CURRENCY}}', ctx.creds.currency)
      .replace('[[WORKING_MEMORY]]', JSON.stringify(enhancedMemory));

    // Get available tools
    const tools = toolRegistry.getOpenAITools();

    // Prepare messages with conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      // Add recent conversation history (last 10 messages)
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Store user message in conversation history
    await addMessageToHistory(ctx.chatSessionId, {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    });

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
      const finalResponse = finalCompletion.choices[0]?.message?.content || "I apologize, but I couldn't complete that task.";
      
      // Store assistant response in conversation history
      await addMessageToHistory(ctx.chatSessionId, {
        role: "assistant",
        content: finalResponse,
        timestamp: new Date().toISOString()
      });
      
      // Update session memory
      await updateSession(ctx.chatSessionId, enhancedMemory);
      
      return finalResponse;
    }

    const response = assistantMessage?.content || "I apologize, but I couldn't generate a response.";
    
    // Store assistant response in conversation history
    await addMessageToHistory(ctx.chatSessionId, {
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString()
    });
    
    // Update session memory
    await updateSession(ctx.chatSessionId, enhancedMemory);
    
    return response;
    
  } catch (error) {
    console.error("Agent execution error:", error);
    throw new Error(`Agent failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}