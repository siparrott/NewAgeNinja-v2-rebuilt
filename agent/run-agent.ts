// Main agent runner - Replit-style super-agent
import { createAgentContext } from "./bootstrap";
import { toolRegistry } from "./core/tools";
import { runLLM } from "./llm/run";
import { addMessageToHistory, getConversationHistory, updateSession } from "./core/memory";
import { planStep } from "./core/plan";
import { executeToolCall, surfaceToolErrors } from "./core/runTools";

const SYSTEM_PROMPT = `You are {{STUDIO_NAME}}'s Autonomous CRM Operations Agent - a Replit-style super-agent.

OPERATIONAL BEHAVIOR
🎯 For EVERY user request:
1. SEARCH FIRST: Use read/search tools to ground yourself in current data
2. PLAN: Determine the exact action needed (create, update, email, schedule)
3. EXECUTE: Run the appropriate action tool with accurate data
4. CONFIRM: Report success with specific details

POLICY & AUTHORITIES
- Mode: {{POLICY_MODE}}
- Authorities: {{POLICY_AUTHORITIES_CSV}}
- Approval limit: {{POLICY_AMOUNT_LIMIT}} {{STUDIO_CURRENCY}}

MEMORY & CONTEXT
Working memory: [[WORKING_MEMORY]]
- Track: current_goal, selected_client_id, last_action
- Update memory when context changes
- Reference conversation history for returning users

DATA GROUNDING PROTOCOL
1. BEFORE answering ANY factual or record-specific request you MUST call the most specific working_read_crm_leads, working_read_crm_clients, working_read_crm_invoices, find_lead, or global_search tools
2. If user supplies a name or partial name, first call read_crm_leads with search parameter
3. If exactly one candidate row appears, and an action is requested, confirm by calling find_lead with exact email or id before performing the action
4. If a tool call returns an error object, adapt: choose another tool or ask the user for the missing field. Do not say "I couldn't complete that task" without a reason
5. If read_crm_leads with a search term returns 0 but user insists the record exists, call enumerate_leads_basic and scan results

AUTONOMOUS EXECUTION RULES
✅ ALWAYS search before stating facts ("Simon has 3 invoices" → search first, then confirm)
✅ CHAIN operations automatically ("Send Simon an email" → find Simon → draft email → show draft)
✅ Handle complex requests ("Update Maria's phone and send confirmation" → update → email)
✅ EMAIL WORKFLOW: When user asks to "send" or "draft" email: 
   1. find_entity(name/email) to get contact ID
   2. draft_email(lead_id=..., subject, body_markdown) to compose 
   3. Show the draft content to user for approval
✅ INVOICE WORKFLOW: When user asks to send invoice:
   1. find_entity(name/email) to get contact ID
   2. create_invoice(client_id, items) to generate invoice
   3. draft_email with invoice details and link for approval
✅ Propose for approvals over {{POLICY_AMOUNT_LIMIT}} {{STUDIO_CURRENCY}}
✅ Confirm every completed action with specific details

RESPONSE STYLE
- Decisive, action-oriented
- Founder-led tone, no-BS approach
- Report exactly what was accomplished with specific details
- Always describe successful tool executions with results
- For booking creation: "Created session [ID] for [Client] on [Date]"
- For email replies: "Sent reply to [Name] at [Email] with subject [Subject]"
- Surface clear errors if tools fail

AVAILABLE TOOLS FOR BOOKING/SCHEDULING:
- create_photography_session: Creates new appointments for clients
- Use this tool when user wants to schedule, book, or create appointments

PRICING & INVOICING RULES:
- When user requests an invoice for a known package (e.g. "10 digital images") call create_invoice with sku: "DIGI-10"
- Standard SKUs: DIGI-10, CANVAS-A4, PRINTS-20, FAMILY-BASIC, NEWBORN-DELUXE
- If SKU not found, use custom_amount and custom_label parameters
- Always include client_id from search results

KEY TOOLS AVAILABLE:
- draft_email: Compose (but do NOT send) an email to a lead/client and store as draft
- send_email: Actually send an email (use only after draft approval)  
- find_entity: Find specific client/lead by name or email
- global_search: Search across all CRM data

Tools available: Auto-generated for all CRM tables + manual tools`;

export async function runAgent(studioId: string, userId: string, message: string): Promise<string> {
  try {
    console.log('🤖 Replit-style super-agent starting for:', message);
    
    // Create agent context with session persistence
    const { loadOrCreateSession, injectMemoryMessage } = await import('./core/memory');
    const session = await loadOrCreateSession(studioId, userId);
    
    const ctx = await createAgentContext(studioId, userId);
    
    // Load conversation history and memory
    const conversationHistory = await getConversationHistory(ctx.chatSessionId);
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

    // REPLIT-STYLE PLANNING STEP - Simple autonomous execution
    console.log('🧠 Auto-generated tools loaded, analyzing request for autonomous execution...');
    
    // Simple planning logic for autonomous execution
    const searchTerms = ['find', 'search', 'look for', 'get', 'show me'];
    const messageWords = message.toLowerCase();
    
    if (searchTerms.some(term => messageWords.includes(term))) {
      console.log('🔍 Detected search request - executing autonomous search');
      
      // Use the cleanQuery function for consistent query cleaning
      const { cleanQuery } = await import('./core/cleanQuery');
      let searchTerm = cleanQuery(message);
      
      if (searchTerm) {
        try {
          const globalSearchTool = toolRegistry.get('global_search');
          if (globalSearchTool) {
            const searchResult = await globalSearchTool.handler({ term: searchTerm }, ctx);
            console.log('✅ Autonomous search executed successfully');
            
            // Store interaction in history
            await addMessageToHistory(ctx.chatSessionId, {
              role: "user", content: message, timestamp: new Date().toISOString()
            });
            
            // Generate execution summary
            let summaryResponse = `✅ Found ${searchResult.leads?.length || 0} leads`;
            if (searchResult.leads && searchResult.leads.length > 0) {
              summaryResponse += `:\n`;
              searchResult.leads.forEach(lead => {
                summaryResponse += `• ${lead.name} (${lead.email})\n`;
              });
            } else {
              summaryResponse += ` for "${searchTerm}"`;
            }
            
            await addMessageToHistory(ctx.chatSessionId, {
              role: "assistant", content: summaryResponse, timestamp: new Date().toISOString()
            });
            
            enhancedMemory.last_action = 'global_search';
            enhancedMemory.lastInteraction = new Date().toISOString();
            await updateSession(ctx.chatSessionId, enhancedMemory);
            
            return summaryResponse;
          }
        } catch (error) {
          console.error('❌ Autonomous search failed:', error);
          return `❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    }
    
    console.log('🔄 Proceeding with traditional agent approach...');
    
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

    // Prepare messages with conversation history and memory injection
    const messages = [
      { role: "system", content: systemPrompt },
      // Add recent conversation history (last 10 messages)
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // Inject memory context
    injectMemoryMessage(messages, enhancedMemory);
    
    // Add current user message
    messages.push({ role: "user", content: message });

    // Store user message in conversation history
    await addMessageToHistory(ctx.chatSessionId, {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    });

    // Run LLM with token limit protection
    const toolCount = tools.length;
    console.log(`🔧 Using ${toolCount} tools for agent execution`);
    
    if (toolCount > 12) {
      console.warn(`⚠️ High tool count (${toolCount}) may cause token limit issues`);
    }
    
    const completion = await runLLM(messages, tools);
    
    // Handle tool calls if present
    const assistantMessage = completion.choices[0]?.message;
    
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Execute tools with enhanced error handling
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const result = await executeToolCall(toolCall, ctx);
        console.log("[TOOL DEBUG]", result);  // Real-time debugging
        toolResults.push({
          tool_call_id: result.tool_call_id,
          role: "tool",
          content: result.output
        });
      }
      
      // Check for tool errors and surface them
      const errText = surfaceToolErrors(toolResults);
      if (errText) {
        console.error("❌ Tool execution errors detected:", errText);
      }

      // Get final response with tool results
      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolResults
      ];

      const finalCompletion = await runLLM(finalMessages, tools);
      let finalResponse = finalCompletion.choices[0]?.message?.content;
      
      // Enhance error handling - surface real errors instead of generic apology
      if (!finalResponse || finalResponse.includes("I apologize") || finalResponse.includes("I couldn't complete")) {
        if (errText) {
          finalResponse = `Error details: ${errText}. Please check the requirements and try again.`;
        } else {
          // Only log success if we have actual semantic success, not just tool execution
          const successfulResults = toolResults.filter(r => {
            try {
              const parsed = JSON.parse(r.content);
              return parsed.ok === true && parsed.data;
            } catch {
              return false;
            }
          });
          
          if (successfulResults.length > 0) {
            // Let the LLM provide proper response instead of generic "task completed"
            finalResponse = "Please provide a detailed response based on the tool results.";
          } else {
            finalResponse = "No successful results to report.";
          }
        }
      }
      
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

/**
 * Generate execution summary for autonomous tool operations
 */
async function generateExecutionSummary(toolName: string, args: any, result: any, ctx: any): Promise<string> {
  if (!result.success) {
    return `❌ ${toolName} failed: ${result.error || 'Unknown error'}`;
  }

  // Generate context-aware success messages
  switch (toolName) {
    case 'global_search':
      const { clients = [], leads = [], invoices = [], sessions = [] } = result;
      const total = clients.length + leads.length + invoices.length + sessions.length;
      if (total === 0) {
        return `🔍 No results found for "${args.searchTerm}". The database doesn't contain any matching records.`;
      }
      return `🔍 Found ${total} results for "${args.searchTerm}": ${clients.length} clients, ${leads.length} leads, ${invoices.length} invoices, ${sessions.length} sessions.`;
      
    case 'send_email':
      return `📧 Email sent successfully to ${args.to} with subject "${args.subject}". Message delivered via SMTP.`;
      
    case 'create_crm_leads':
    case 'createCrmLeads':
      return `✅ New lead created: ${result.data?.name || 'Unknown'} (${result.data?.email || 'No email'}). Lead ID: ${result.data?.id}`;
      
    case 'update_crm_clients':
    case 'updateCrmClients':
      return `✅ Client updated successfully. Changes applied to ${result.data?.name || 'client'}.`;
      
    case 'read_crm_invoices':
      return `📊 Found ${result.count || 0} invoices. ${result.data?.length ? `Latest: ${result.data[0].total || 'N/A'}` : ''}`;
      
    default:
      if (result.data && result.count !== undefined) {
        return `✅ ${toolName} completed successfully. Found ${result.count} records.`;
      }
      return `✅ ${toolName} completed successfully.`;
  }
}