import { Router } from 'express';
import { z } from 'zod';
import { createAgentContext } from '../../agent/bootstrap';
import { toolRegistry } from '../../agent/core/tools';
import { formatProposalForAssistant } from '../../agent/core/proposals';
import type { ProposalResponse } from '../../agent/core/proposals';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const crmAgentChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  threadId: z.string().optional(),
  studioId: z.string().default('default-studio'),
  userId: z.string().optional(),
});

// Enhanced CRM Agent endpoint with Phase B write capabilities
router.post('/chat', async (req, res) => {
  try {
    const { message, threadId, studioId, userId } = crmAgentChatSchema.parse(req.body);

    // Create agent context with enhanced Phase B capabilities
    const ctx = await createAgentContext(studioId, userId || 'anonymous');
    
    console.log('CRM Agent Chat Request:', {
      message: message.slice(0, 100) + '...',
      policy: ctx.policy.mode,
      authorities: ctx.policy.authorities,
      writeToolsAvailable: toolRegistry.list().filter(t => t.name.includes('write')).length
    });

    // Create thread if needed
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // Add user message to thread
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message,
    });

    // Enhanced system instructions with working memory and proposals
    const systemInstructions = `You are New Age Fotografie's CRM Operations Assistant, embedded in the photography studio dashboard chat.

────────────────────────────────  CONTEXT  ────────────────────────────────
studio_id: ${ctx.studioId}
studio_currency: ${ctx.creds.currency || 'EUR'}
automation_mode: ${ctx.policy.mode}        (read_only | propose | auto_safe | auto_all)
authorities: ${ctx.policy.authorities.join(', ')}
approval_limit: ${ctx.policy.approval_required_over_amount} ${ctx.creds.currency || 'EUR'}
email_mode: ${ctx.policy.email_send_mode}
restricted_fields: Client email/phone, Invoice amounts over limit

──────────────────────  MEMORY (VERY IMPORTANT)  ──────────────────────────
Each turn you may receive a message that starts with **[[WORKING_MEMORY]]**  
followed by JSON.  
That JSON is persistent "working memory" for this chat session.

Use it to:
• Recall the current_goal ("Send invoice to Anna")  
• Remember which client / session the user selected  
• Track pending proposals that still need approval  
• Respect user_prefs (language, currency, default package)  
• Store short notes that help you stay personal ("They prefer Thursday mornings.")

***Never*** echo the raw JSON back to the user.  
When something in memory should change, call the **update_memory** tool with a PATCH that modifies ONLY the fields that changed.  
• Don't wipe unrelated fields.  
• Append notes instead of overwriting unless told otherwise.

If memory lacks information you need, **ask the user**.

──────────────────────────  BEHAVIOR RULES  ───────────────────────────────
1. Use TOOLS for ALL data access or CRM changes. Never invent IDs or totals.  
2. For write ops, first call the matching *propose_or_* tool.  
   – If it returns \`proposed_actions\`, show them & wait for approval.  
   – If it returns \`status:"created"\` / \`"updated"\`, confirm success.  
3. Summarize what you did in plain language, then suggest next step.  
4. Keep paragraphs ≤ 3 sentences; lists for clarity.  
5. Ask before listing more than 25 items.  
6. Always include ${ctx.creds.currency || 'EUR'} symbol when quoting money.  
7. Booking CTA if relevant: <https://www.newagefotografie.com/warteliste/>

────────────────  OUTPUT WHEN PROPOSING ACTIONS  ──────────────────────────
After your human-readable reply, include a JSON object exactly like:
\`\`\`json
{
  "proposed_actions": [
    {
      "id": "e4f1c8a2b9d3",
      "label": "Create invoice draft €350",
      "tool": "propose_or_create_invoice_draft",
      "args": { ... },
      "requires_approval": true,
      "reason": "Amount exceeds auto limit."
    }
  ]
}
\`\`\`
The front-end converts these into Approve / Reject buttons.

──────────────────────────── TONE ───────────────────────────────────────
Friendly, founder-led, concise. Mirror the user's language (Deutsch/English).
Use real-life studio examples when helpful. Avoid jargon.

AVAILABLE TOOLS AND CAPABILITIES:
📧 EMAIL MANAGEMENT: Draft and send emails, manage communications
📅 APPOINTMENT SCHEDULING: Create, modify, cancel appointments
👥 CLIENT MANAGEMENT: Create leads, update client information
💰 INVOICE MANAGEMENT: Create invoice drafts, track payments
📊 DATA OPERATIONS: Read CRM data, generate reports
⚡ TASK AUTOMATION: Automate routine business processes`;

    // Run assistant with enhanced tools
    const tools = toolRegistry.getOpenAITools();
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: 'asst_CH4vIbZPs7gUD36Lxf7vlfIV',
      instructions: systemInstructions,
      tools: tools,
    });

    // Wait for completion and handle tool calls
    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    }

    let responseContent = '';
    let toolResults: any[] = [];

    // Handle tool calls if present
    if (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
      const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        const tool = toolRegistry.get(toolCall.function.name);
        if (tool) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result: ProposalResponse = await tool.handler(args, ctx);
            
            toolResults.push({
              tool: toolCall.function.name,
              args,
              result: result.status,
              message: result.message,
              proposedActions: result.proposed_actions || []
            });

            // Format response based on result
            let toolOutput = '';
            if (result.status === 'success') {
              toolOutput = `✅ ${result.message || 'Operation completed successfully'}`;
            } else if (result.status === 'needs_approval') {
              toolOutput = `⏸️ Approval Required: ${result.message}\n\n${formatProposalForAssistant(result.proposed_actions || [])}`;
            } else if (result.status === 'denied') {
              toolOutput = `❌ Operation Denied: ${result.message}`;
            } else if (result.status === 'error') {
              toolOutput = `❌ Error: ${result.error}`;
            }

            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: toolOutput,
            });
          } catch (error) {
            console.error('Tool execution error:', error);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: `❌ Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        }
      }

      // Submit tool outputs
      await openai.beta.threads.runs.submitToolOutputs(currentThreadId, run.id, {
        tool_outputs: toolOutputs,
      });

      // Wait for final completion
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      }
    }

    // Get final response
    const messages = await openai.beta.threads.messages.list(currentThreadId);
    const lastMessage = messages.data[0];
    
    if (lastMessage && lastMessage.content && lastMessage.content[0]) {
      responseContent = lastMessage.content[0].text.value;
    }

    res.json({
      response: responseContent,
      threadId: currentThreadId,
      runId: run.id,
      policyMode: ctx.policy.mode,
      toolResults,
      writeCapabilities: {
        available: toolRegistry.list().filter(t => t.name.includes('write')).length,
        authorities: ctx.policy.authorities,
        approvalThreshold: ctx.policy.approval_required_over_amount
      }
    });

  } catch (error) {
    console.error('CRM Agent Chat Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get agent status and capabilities
router.get('/status', async (req, res) => {
  try {
    const studioId = req.query.studioId as string || 'default-studio';
    const userId = req.query.userId as string || 'anonymous';
    
    const ctx = await createAgentContext(studioId, userId);
    const tools = toolRegistry.list();
    
    res.json({
      status: 'operational',
      policy: {
        mode: ctx.policy.mode,
        authorities: ctx.policy.authorities,
        writeCapabilities: ctx.policy.authorities.filter(a => ['CREATE_LEAD', 'UPDATE_CLIENT', 'SEND_INVOICE'].includes(a)),
        approvalThreshold: ctx.policy.approval_required_over_amount,
        maxOpsPerHour: ctx.policy.max_ops_per_hour
      },
      tools: {
        total: tools.length,
        read: tools.filter(t => t.name.includes('list') || t.name.includes('lookup')).length,
        write: tools.filter(t => t.name.includes('write') || t.name.includes('propose')).length,
        available: tools.map(t => ({
          name: t.name,
          description: t.description,
          type: t.name.includes('write') ? 'write' : 'read'
        }))
      }
    });
  } catch (error) {
    console.error('Agent Status Error:', error);
    res.status(500).json({
      error: 'Failed to get agent status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;