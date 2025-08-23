import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx.js";
import { allowWrite } from "../core/guardrails.js";

// Simple authority check for voucher management
function requireAuthority(ctx: AgentCtx, authority: string) {
  const result = allowWrite(ctx, authority);
  if (result !== "allow") {
    throw new Error(`Authorization denied: ${authority}`);
  }
}

const sql = neon(process.env.DATABASE_URL!);

// Generate unique voucher code
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createVoucherProductTool = {
  name: "create_voucher_product",
  description: "Create a new voucher product for sale",
  parameters: z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be positive"),
    validityMonths: z.number().default(12)
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "MANAGE_VOUCHERS");
    
    try {
      const result = await sql`
        INSERT INTO voucher_products (name, description, price, validity_period)
        VALUES (${args.name}, ${args.description || ''}, ${args.price}, ${args.validityMonths})
        RETURNING *
      `;
      
      return {
        success: true,
        voucherProduct: result[0],
        message: `Created voucher product: ${args.name} (€${args.price})`
      };
    } catch (error) {
      console.error('❌ create_voucher_product error:', error);
      throw new Error(`Failed to create voucher product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const sellVoucherTool = {
  name: "sell_voucher",
  description: "Sell a voucher to a client or external buyer",
  parameters: z.object({
    voucherProductId: z.string().uuid("Valid voucher product ID required"),
    clientId: z.string().uuid().optional(),
    buyerName: z.string().min(1, "Buyer name is required"),
    buyerEmail: z.string().email("Valid email required"),
    paymentStatus: z.enum(["pending", "paid", "failed"]).default("paid")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "MANAGE_VOUCHERS");
    
    try {
      // Get voucher product details
      const productResult = await sql`
        SELECT * FROM voucher_products 
        WHERE id = ${args.voucherProductId}
        LIMIT 1
      `;
      
      if (productResult.length === 0) {
        throw new Error("Voucher product not found");
      }
      
      const product = productResult[0];
      const voucherCode = generateVoucherCode();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (product.validity_period || 12));
      
      const result = await sql`
        INSERT INTO voucher_sales (
          product_id, voucher_code, purchaser_name, purchaser_email,
          original_amount, final_amount, payment_status, expiry_date, status
        ) VALUES (
          ${args.voucherProductId}, ${voucherCode}, ${args.buyerName}, ${args.buyerEmail},
          ${product.price}, ${product.price}, ${args.paymentStatus}, ${expiryDate.toISOString().split('T')[0]}, 'active'
        )
        RETURNING *
      `;
      
      return {
        success: true,
        voucherSale: result[0],
        voucherCode: voucherCode,
        message: `Sold voucher "${product.name}" to ${args.buyerName} - Code: ${voucherCode}`
      };
    } catch (error) {
      console.error('❌ sell_voucher error:', error);
      throw new Error(`Failed to sell voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const readVoucherSalesTool = {
  name: "read_voucher_sales",
  description: "Read voucher sales with optional filters",
  parameters: z.object({
    limit: z.number().default(25),
    status: z.enum(["all", "pending", "paid", "redeemed"]).default("all"),
    clientId: z.string().uuid().optional()
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "MANAGE_VOUCHERS");
    
    try {
      let query = `
        SELECT 
          vs.*,
          vp.name as product_name,
          vp.description as product_description
        FROM voucher_sales vs
        JOIN voucher_products vp ON vs.product_id = vp.id
        WHERE 1=1
      `;
      
      if (args.status !== "all") {
        if (args.status === "redeemed") {
          query += ` AND vs.status = 'redeemed'`;
        } else {
          query += ` AND vs.payment_status = '${args.status}'`;
        }
      }
      
      query += ` ORDER BY vs.created_at DESC LIMIT ${args.limit}`;
      
      const result = await sql(query);
      
      return {
        success: true,
        sales: result,
        count: result.length,
        message: `Found ${result.length} voucher sales`
      };
    } catch (error) {
      console.error('❌ read_voucher_sales error:', error);
      throw new Error(`Failed to read voucher sales: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const redeemVoucherTool = {
  name: "redeem_voucher",
  description: "Mark a voucher as redeemed",
  parameters: z.object({
    voucherCode: z.string().min(1, "Voucher code is required"),
    notes: z.string().optional()
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "MANAGE_VOUCHERS");
    
    try {
      const result = await sql`
        UPDATE voucher_sales 
        SET status = 'redeemed', redemption_date = NOW(), redemption_notes = ${args.notes || ''}
        WHERE voucher_code = ${args.voucherCode}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Voucher code not found");
      }
      
      return {
        success: true,
        voucherSale: result[0],
        message: `Voucher ${args.voucherCode} successfully redeemed`
      };
    } catch (error) {
      console.error('❌ redeem_voucher error:', error);
      throw new Error(`Failed to redeem voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};