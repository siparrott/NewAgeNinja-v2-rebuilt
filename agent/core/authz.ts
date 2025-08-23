import type { AgentCtx } from "./ctx.js";
import type { Authority } from "./policy.js";

export class AuthorizationError extends Error {
  constructor(message: string, public authority: Authority) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requireAuthority(ctx: AgentCtx, authority: Authority): void {
  if (!ctx.policy.authorities.includes(authority)) {
    throw new AuthorizationError(
      `Authority ${authority} not granted for studio ${ctx.studioId}`,
      authority
    );
  }
}

export function hasAuthority(ctx: AgentCtx, authority: Authority): boolean {
  return ctx.policy.authorities.includes(authority);
}

export function checkMultipleAuthorities(ctx: AgentCtx, authorities: Authority[]): Authority[] {
  return authorities.filter(auth => !ctx.policy.authorities.includes(auth));
}