import { z } from "zod";
import type { AgentCtx } from "../core/ctx.js";
import { requireAuthority } from "../core/authz.js";
import { enforceGuardrail } from "../core/guardrails.js";
import { auditLogProposal, auditLogExecution, auditLogFailure } from "../core/audit.js";
import { makeProposal, createSuccessResponse, createApprovalResponse, createDeniedResponse, createErrorResponse } from "../core/proposals.js";
import type { ProposalResponse } from "../core/proposals.js";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { crmInvoices, crmInvoiceItems, crmClients } from "../../shared/schema.js";
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export const invoiceWriteTool = {
  name: "propose_or_create_invoice_draft",
  description: "Create a draft invoice with monetary threshold checks",
  parameters: z.object({
    clientId: z.string().uuid("Valid client ID is required"),
    items: z.array(z.object({
      description: z.string().min(1, "Item description is required"),
      quantity: z.number().min(0.01, "Quantity must be positive"),
      unitPrice: z.number().min(0, "Unit price must be non-negative"),
      taxRate: z.number().min(0).max(100).default(20) // 20% default tax rate
    })).min(1, "At least one item is required"),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
    currency: z.string().default("EUR"),
    risk: z.enum(["low", "med", "high"]).default("high") // Invoice creation is high risk
  }),
  handler: async (args: any, ctx: AgentCtx): Promise<ProposalResponse> => {
    try {
      // Check authority
      requireAuthority(ctx, "SEND_INVOICE");

      // Fetch client
      const clients = await db
        .select()
        .from(crmClients)
        .where(
          and(
            eq(crmClients.id, args.clientId),
            eq(crmClients.studioId, ctx.studioId)
          )
        );

      if (clients.length === 0) {
        return createErrorResponse(`Client not found: ${args.clientId}`);
      }

      const client = clients[0];

      // Calculate totals
      const subtotal = args.items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unitPrice), 0
      );
      const taxAmount = args.items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0
      );
      const total = subtotal + taxAmount;

      // Evaluate guardrail with monetary threshold
      const decision = enforceGuardrail(ctx, {
        authority: "SEND_INVOICE",
        action: "create_invoice_draft",
        table: "crm_invoices",
        fields: { clientId: args.clientId, amount: total },
        amount: total,
        risk: args.risk
      });

      if (decision.decision === "deny") {
        await auditLogFailure(ctx.studioId, ctx.userId, "create_invoice_draft", "crm_invoices", 
          new Error(decision.reason), args);
        return createDeniedResponse(decision.reason);
      }

      if (decision.decision === "needs_approval") {
        const itemsSummary = args.items.map((item: any) => 
          `${item.description} (${item.quantity}x ${item.unitPrice}€)`
        ).join(", ");

        const proposal = makeProposal(
          "propose_or_create_invoice_draft",
          args,
          true,
          `Create invoice draft for ${client.name}: ${total.toFixed(2)} ${args.currency}`,
          decision.reason,
          args.risk,
          "2 minutes",
          `Draft invoice: ${itemsSummary} | Total: ${total.toFixed(2)} ${args.currency}`
        );

        await auditLogProposal(ctx.studioId, ctx.userId, "create_invoice_draft", "crm_invoices", 
          { ...args, calculatedTotal: total }, args.risk);
        return createApprovalResponse([proposal], `Invoice creation requires approval: ${decision.reason}`);
      }

      // Execute immediately - decision.decision === "allow"
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      const dueDate = args.dueDate ? new Date(args.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const invoiceData = {
        invoiceNumber,
        clientId: args.clientId,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address || "",
        issueDate: new Date(),
        dueDate,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        currency: args.currency,
        status: "draft" as const,
        notes: args.notes || "",
        studioId: ctx.studioId,
        createdBy: ctx.userId,
      };

      const [newInvoice] = await db.insert(crmInvoices).values(invoiceData).returning();

      // Create invoice items
      const invoiceItems = args.items.map((item: any, index: number) => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        taxRate: item.taxRate.toString(),
        sortOrder: index
      }));

      await db.insert(crmInvoiceItems).values(invoiceItems);

      await auditLogExecution(
        ctx.studioId, 
        ctx.userId, 
        "create_invoice_draft", 
        "crm_invoices", 
        newInvoice.id, 
        null, 
        { ...newInvoice, items: invoiceItems },
        undefined,
        total
      );

      return createSuccessResponse(
        { invoice: newInvoice, items: invoiceItems },
        `Invoice draft created successfully: ${invoiceNumber} (${total.toFixed(2)} ${args.currency})`
      );

    } catch (error) {
      console.error("Invoice creation failed:", error);
      await auditLogFailure(ctx.studioId, ctx.userId, "create_invoice_draft", "crm_invoices", error, args);
      return createErrorResponse(`Failed to create invoice: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};