import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { getPriceBySku } from "../integrations/pricing.js";
import type { AgentCtx } from "../core/ctx.js";

const sql = neon(process.env.DATABASE_URL!);

export const createInvoiceTool = {
  name: "create_invoice",
  description: "Create an invoice with multiple items. Supports SKU items from price list OR custom items. Use SKUs for standard packages like 'DIGI-10' for 10 digital images.",
  parameters: z.object({
    client_id: z.string().describe("Client UUID from database"),
    items: z.array(z.object({
      sku: z.string().optional().describe("SKU code from price list (e.g. DIGI-10, CANVAS-A4, PRINTS-20)"),
      qty: z.number().default(1).describe("Quantity of this item"),
      custom_label: z.string().optional().describe("Custom service description if not using SKU"),
      custom_amount: z.number().optional().describe("Custom amount in EUR if not using SKU")
    })).optional().describe("Array of invoice items"),
    // Legacy single-item support
    sku: z.string().optional().describe("Single SKU code from price list"),
    custom_label: z.string().optional().describe("Custom service description if not using SKU"),
    custom_amount: z.number().optional().describe("Custom amount in EUR if not using SKU"),
    notes: z.string().optional().describe("Additional notes for the invoice")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Process items (either from items array or legacy single item)
      let invoiceItems = [];
      
      if (args.items && args.items.length > 0) {
        // Multi-item invoice
        for (const item of args.items) {
          if (item.sku) {
            const price = await getPriceBySku(ctx.studioId, item.sku);
            if (!price) {
              // Instead of throwing error, create custom item with needs_review flag
              console.log(`⚠️ SKU "${item.sku}" not found, creating custom item with needs_review flag`);
              invoiceItems.push({
                description: `${item.sku} (SKU not found - needs review)`,
                quantity: item.qty || 1,
                unit_price: 0,
                total: 0,
                needs_review: true,
                original_sku: item.sku
              });
              continue;
            }
            invoiceItems.push({
              description: price.label,
              quantity: item.qty || 1,
              unit_price: Number(price.unit_price),
              total: Number(price.unit_price) * (item.qty || 1)
            });
          } else if (item.custom_amount) {
            invoiceItems.push({
              description: item.custom_label || "Custom service",
              quantity: item.qty || 1,
              unit_price: item.custom_amount,
              total: item.custom_amount * (item.qty || 1)
            });
          }
        }
      } else {
        // Legacy single item
        if (args.sku) {
          const price = await getPriceBySku(ctx.studioId, args.sku);
          if (!price) {
            // Instead of throwing error, create custom item with needs_review flag  
            console.log(`⚠️ SKU "${args.sku}" not found, creating custom item with needs_review flag`);
            invoiceItems.push({
              description: `${args.sku} (SKU not found - needs review)`,
              quantity: 1,
              unit_price: 0,
              total: 0,
              needs_review: true,
              original_sku: args.sku
            });
          } else {
            invoiceItems.push({
              description: price.label,
              quantity: 1,
              unit_price: Number(price.unit_price),
              total: Number(price.unit_price)
            });
          }
        } else if (args.custom_amount) {
          invoiceItems.push({
            description: args.custom_label || "Custom service",
            quantity: 1,
            unit_price: args.custom_amount,
            total: args.custom_amount
          });
        }
      }

      if (invoiceItems.length === 0) {
        throw new Error("invoice:no_products - No valid invoice items provided. Need either SKU or custom_amount for at least one item.");
      }

      const invoiceTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
      const description = invoiceItems.map(item => `${item.quantity}x ${item.description}`).join(", ");
      
      // Check if any items need review
      const needsReview = invoiceItems.some(item => item.needs_review);
      const status = needsReview ? 'draft' : 'pending';

      // Create invoice in database
      const invoiceResult = await sql`
        INSERT INTO crm_invoices (
          client_id, invoice_number, subtotal, total, status, notes, issue_date, due_date
        ) VALUES (
          ${args.client_id}, 
          'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::text, 4, '0'),
          ${invoiceTotal},
          ${invoiceTotal},
          ${status},
          ${args.notes || ''},
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '30 days'
        )
        RETURNING *
      `;

      const invoice = invoiceResult[0];

      // Add all invoice items
      for (const item of invoiceItems) {
        await sql`
          INSERT INTO crm_invoice_items (
            invoice_id, description, quantity, unit_price, tax_rate, sort_order
          ) VALUES (
            ${invoice.id}, ${item.description}, ${item.quantity}, ${item.unit_price}, 0, ${invoiceItems.indexOf(item) + 1}
          )
        `;
      }

      const result: any = {
        status: needsReview ? "created_with_review" : "created",
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        description: description,
        total: invoiceTotal,
        currency: "EUR",
        client_id: args.client_id,
        items: invoiceItems,
        needs_review: needsReview
      };

      if (needsReview) {
        result.review_message = "⚠️ Some SKUs were not found in the price list. Items marked for review with €0 amount. Please update pricing before sending invoice.";
      }

      // Ensure we always return meaningful data
      console.log(`✅ Invoice created: ${invoice.invoice_number} for client ${args.client_id}, total: €${invoiceTotal}`);
      
      return result;

    } catch (error) {
      console.error('❌ create_invoice error:', error);
      throw error;
    }
  }
};