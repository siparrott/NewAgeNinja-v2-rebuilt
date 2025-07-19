// Agent system bootstrap
import { loadSession, type WorkingMemory } from "./core/memory";
import { allowWrite } from "./core/guardrails";
import type { AgentCtx } from "./core/ctx";

export async function createAgentContext(studioId: string, userId: string): Promise<AgentCtx & { chatSessionId: string, memory: WorkingMemory }> {
  // Load or create session
  const session = await loadSession(studioId, userId);
  
  // Default policy for New Age Fotografie
  const defaultPolicy = {
    mode: "auto_safe" as const,
    authorities: [
      "READ_CLIENTS",
      "READ_LEADS", 
      "READ_SESSIONS",
      "READ_INVOICES",
      "CREATE_LEAD",
      "UPDATE_CLIENT", 
      "SEND_EMAIL",
      "DRAFT_EMAIL"
    ],
    approval_required_over_amount: 500,
    email_send_mode: "auto",
    invoice_auto_limit: 1000
  };

  const ctx: AgentCtx & { chatSessionId: string, memory: WorkingMemory } = {
    studioId,
    userId,
    studioName: "New Age Fotografie",
    mode: defaultPolicy.mode,
    policy: defaultPolicy,
    creds: {
      currency: "EUR"
    },
    chatSessionId: session.id,
    memory: session.memory_json || {}
  };

  return ctx;
}