import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { getPriceBySku } from "../integrations/pricing";
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

export const createInvoiceTool = {
  name: "create_invoice",
  description: "Create an invoice by SKU (from price list) OR custom amount. Use SKU for standard packages like 'DIGI-10' for 10 digital images.",
  parameters: z.object({
    client_id: z.string().describe("Client UUID from database"),
    sku: z.string().optional().describe("SKU code from price list (e.g. DIGI-10, CANVAS-A4, PRINTS-20)"),
    custom_label: z.string().optional().describe("Custom service description if not using SKU"),
    custom_amount: z.number().optional().describe("Custom amount in EUR if not using SKU"),
    notes: z.string().optional().describe("Additional notes for the invoice")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      let label: string, total: number, currency: string;

      if (args.sku) {
        // Use price list lookup
        const price = await getPriceBySku(ctx.studioId, args.sku);
        if (!price) {
          throw new Error(`pricing:not_found - SKU "${args.sku}" not found in price list`);
        }
        label = price.label;
        total = Number(price.unit_price);
        currency = price.currency;
      } else if (args.custom_amount) {
        // Use custom pricing
        label = args.custom_label || "Custom service";
        total = args.custom_amount;
        currency = ctx.creds.currency || "EUR";
      } else {
        throw new Error("pricing:missing_params - Need either SKU or custom_amount");
      }

      // Create invoice in database
      const invoiceResult = await sql`
        INSERT INTO crm_invoices (
          studio_id, client_id, invoice_number, description, 
          total, currency, status, notes, created_at
        ) VALUES (
          ${ctx.studioId}, 
          ${args.client_id}, 
          'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::text, 4, '0'),
          ${label},
          ${total},
          ${currency},
          'pending',
          ${args.notes || ''},
          NOW()
        )
        RETURNING *
      `;

      const invoice = invoiceResult[0];

      // Add invoice item
      await sql`
        INSERT INTO crm_invoice_items (
          invoice_id, description, quantity, unit_price, total
        ) VALUES (
          ${invoice.id}, ${label}, 1, ${total}, ${total}
        )
      `;

      return {
        status: "created",
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          description: label,
          total: total,
          currency: currency,
          client_id: args.client_id
        }
      };

    } catch (error) {
      console.error('❌ create_invoice error:', error);
      throw error;
    }
  }
};