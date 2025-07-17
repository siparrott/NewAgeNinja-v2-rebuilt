import { z } from "zod";
import type { AgentCtx } from "../core/ctx";
import { requireAuthority } from "../core/authz";
import { enforceGuardrail } from "../core/guardrails";
import { auditLogProposal, auditLogExecution, auditLogFailure } from "../core/audit";
import { makeProposal, createSuccessResponse, createApprovalResponse, createDeniedResponse, createErrorResponse } from "../core/proposals";
import type { ProposalResponse } from "../core/proposals";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { crmLeads } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export const leadWriteTool = {
  name: "propose_or_create_lead",
  description: "Create a new lead if it does not exist; else return existing. Guardrail aware.",
  parameters: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"), 
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    message: z.string().optional(),
    source: z.string().default("CRM Assistant"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    risk: z.enum(["low", "med", "high"]).default("low")
  }),
  handler: async (args: any, ctx: AgentCtx): Promise<ProposalResponse> => {
    try {
      // Check authority
      requireAuthority(ctx, "CREATE_LEAD");

      // Check for existing lead by email
      const existingLeads = await db
        .select()
        .from(crmLeads)
        .where(eq(crmLeads.email, args.email.toLowerCase()));

      if (existingLeads.length > 0) {
        return createSuccessResponse(
          existingLeads[0], 
          `Lead already exists for ${args.email}`
        );
      }

      // Evaluate guardrail
      const decision = enforceGuardrail(ctx, {
        authority: "CREATE_LEAD",
        action: "create_lead",
        table: "crm_leads",
        fields: args,
        risk: args.risk,
        email_domain: args.email.split('@')[1]
      });

      if (decision.decision === "deny") {
        await auditLogFailure(ctx.studioId, ctx.userId, "create_lead", "crm_leads", 
          new Error(decision.reason), args);
        return createDeniedResponse(decision.reason);
      }

      if (decision.decision === "needs_approval") {
        const proposal = makeProposal(
          "propose_or_create_lead",
          args,
          true,
          `Create new lead: ${args.firstName} ${args.lastName} (${args.email})`,
          decision.reason,
          args.risk,
          "immediate",
          `New lead will be created with email ${args.email} and priority ${args.priority}`
        );

        await auditLogProposal(ctx.studioId, ctx.userId, "create_lead", "crm_leads", args, args.risk);
        return createApprovalResponse([proposal], `Lead creation requires approval: ${decision.reason}`);
      }

      // Execute immediately - decision.decision === "allow"
      const leadData = {
        name: `${args.firstName} ${args.lastName}`,
        email: args.email.toLowerCase(),
        phone: args.phone || "",
        message: args.message || "",
        source: args.source,
        status: "new" as const,
        priority: args.priority,
        value: 0,
        tags: ["assistant-created"],
        follow_up_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        assigned_to: ctx.userId,
      };

      console.log('About to insert lead data:', leadData);
      const [newLead] = await db.insert(crmLeads).values(leadData).returning();
      
      await auditLogExecution(
        ctx.studioId, 
        ctx.userId, 
        "create_lead", 
        "crm_leads", 
        newLead.id, 
        null, 
        newLead
      );

      return createSuccessResponse(
        newLead,
        `Lead created successfully for ${args.firstName} ${args.lastName}`
      );

    } catch (error) {
      console.error("Lead creation failed:", error);
      await auditLogFailure(ctx.studioId, ctx.userId, "create_lead", "crm_leads", error, args);
      return createErrorResponse(`Failed to create lead: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};