import type { AgentCtx } from "./ctx";
import type { Authority } from "./policy";

export function hasAuthority(ctx: AgentCtx, a: Authority) {
  return ctx.policy.authorities.includes(a);
}

export function requireAuthority(ctx: AgentCtx, a: Authority) {
  if (!hasAuthority(ctx, a)) throw new Error(`Policy forbids: ${a}`);
}