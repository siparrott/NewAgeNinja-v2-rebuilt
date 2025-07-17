import type { AgentCtx } from "./ctx";
import type { Authority } from "./policy";

export type GuardrailDecision = 
  | { decision: "allow" }
  | { decision: "needs_approval"; reason: string }
  | { decision: "deny"; reason: string };

interface GuardrailCheckInput {
  authority: Authority;
  action?: string;
  table?: string;
  fields?: Record<string, any>;
  amount?: number; // invoice totals
  risk?: "low" | "med" | "high";
  email_domain?: string;
}

export function evaluateGuardrail(ctx: AgentCtx, input: GuardrailCheckInput): GuardrailDecision {
  const pol = ctx.policy;

  // Authority required
  if (!pol.authorities.includes(input.authority)) {
    return { decision: "deny", reason: `Authority ${input.authority} not granted.` };
  }

  // Mode read_only?
  if (pol.mode === "read_only") {
    return { decision: "needs_approval", reason: "Policy read_only." };
  }

  // Restricted fields?
  if (input.table && input.fields && pol.restricted_fields?.[input.table]) {
    const blocked = Object.keys(input.fields).filter(f => pol.restricted_fields[input.table].includes(f));
    if (blocked.length) {
      return { decision: "needs_approval", reason: `Restricted fields: ${blocked.join(",")}` };
    }
  }

  // Monetary threshold
  if (typeof input.amount === "number" && input.amount > pol.approval_required_over_amount) {
    return { decision: "needs_approval", reason: `Amount ${input.amount} exceeds auto limit ${pol.approval_required_over_amount}.` };
  }

  // Email domain check
  if (input.email_domain && !pol.email_domain_trustlist.includes(input.email_domain)) {
    return { decision: "needs_approval", reason: `Email domain ${input.email_domain} not in trustlist.` };
  }

  // Mode propose?
  if (pol.mode === "propose") {
    return { decision: "needs_approval", reason: "Propose mode." };
  }

  // Mode auto_safe: check if action is in auto_safe_actions list
  if (pol.mode === "auto_safe") {
    if (input.action && !pol.auto_safe_actions.includes(input.action)) {
      return { decision: "needs_approval", reason: `Action ${input.action} not in auto_safe list.` };
    }
    
    // Also check risk level - require approval for medium/high risk
    if (input.risk && input.risk !== "low") {
      return { decision: "needs_approval", reason: `Risk ${input.risk} requires approval.` };
    }
  }

  // Mode auto_all: allow everything (within authority limits)
  return { decision: "allow" };
}

export function enforceGuardrail(ctx: AgentCtx, input: GuardrailCheckInput): GuardrailDecision {
  const decision = evaluateGuardrail(ctx, input);
  
  // Log guardrail check
  console.log(`Guardrail check: ${input.authority} on ${input.table || 'unknown'} - ${decision.decision}`, {
    studioId: ctx.studioId,
    userId: ctx.userId,
    authority: input.authority,
    table: input.table,
    decision: decision.decision,
    reason: decision.decision !== "allow" ? decision.reason : undefined
  });

  return decision;
}