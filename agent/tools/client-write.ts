import { z } from "zod";
import type { AgentCtx } from "../core/ctx.js";
import { requireAuthority } from "../core/authz.js";
import { enforceGuardrail } from "../core/guardrails.js";
import { auditLogProposal, auditLogExecution, auditLogFailure } from "../core/audit.js";
import { makeProposal, createSuccessResponse, createApprovalResponse, createDeniedResponse, createErrorResponse } from "../core/proposals.js";
import type { ProposalResponse } from "../core/proposals.js";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { crmClients } from "../../shared/schema.js";
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export const clientUpdateTool = {
  name: "propose_or_update_client_fields",
  description: "Update specific client fields with guardrail checks for restricted fields",
  parameters: z.object({
    clientId: z.string().uuid("Valid client ID is required"),
    updates: z.record(z.any()).refine(
      (data) => Object.keys(data).length > 0,
      "At least one field to update is required"
    ),
    risk: z.enum(["low", "med", "high"]).default("med") // Client updates are medium risk by default
  }),
  handler: async (args: any, ctx: AgentCtx): Promise<ProposalResponse> => {
    try {
      // Check authority
      requireAuthority(ctx, "UPDATE_CLIENT");

      // Fetch existing client
      const existingClients = await db
        .select()
        .from(crmClients)
        .where(
          and(
            eq(crmClients.id, args.clientId),
            eq(crmClients.studioId, ctx.studioId)
          )
        );

      if (existingClients.length === 0) {
        return createErrorResponse(`Client not found: ${args.clientId}`);
      }

      const existingClient = existingClients[0];

      // Evaluate guardrail
      const decision = enforceGuardrail(ctx, {
        authority: "UPDATE_CLIENT",
        action: "update_client_fields",
        table: "crm_clients",
        fields: args.updates,
        risk: args.risk,
        email_domain: args.updates.email ? args.updates.email.split('@')[1] : undefined
      });

      if (decision.decision === "deny") {
        await auditLogFailure(ctx.studioId, ctx.userId, "update_client_fields", "crm_clients", 
          new Error(decision.reason), args);
        return createDeniedResponse(decision.reason);
      }

      if (decision.decision === "needs_approval") {
        const updatePreview = Object.entries(args.updates)
          .map(([key, value]) => `${key}: ${existingClient[key as keyof typeof existingClient]} → ${value}`)
          .join(", ");

        const proposal = makeProposal(
          "propose_or_update_client_fields",
          args,
          true,
          `Update client: ${existingClient.name} (${Object.keys(args.updates).join(", ")})`,
          decision.reason,
          args.risk,
          "immediate",
          updatePreview
        );

        await auditLogProposal(ctx.studioId, ctx.userId, "update_client_fields", "crm_clients", args, args.risk);
        return createApprovalResponse([proposal], `Client update requires approval: ${decision.reason}`);
      }

      // Execute immediately - decision.decision === "allow"
      const updatedData = {
        ...existingClient,
        ...args.updates,
        updatedAt: new Date()
      };

      const [updatedClient] = await db
        .update(crmClients)
        .set(updatedData)
        .where(
          and(
            eq(crmClients.id, args.clientId),
            eq(crmClients.studioId, ctx.studioId)
          )
        )
        .returning();

      await auditLogExecution(
        ctx.studioId, 
        ctx.userId, 
        "update_client_fields", 
        "crm_clients", 
        args.clientId, 
        existingClient, 
        updatedClient
      );

      return createSuccessResponse(
        updatedClient,
        `Client updated successfully: ${updatedClient.name}`
      );

    } catch (error) {
      console.error("Client update failed:", error);
      await auditLogFailure(ctx.studioId, ctx.userId, "update_client_fields", "crm_clients", error, args);
      return createErrorResponse(`Failed to update client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};