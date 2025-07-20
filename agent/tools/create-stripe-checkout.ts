import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

export const createGalleryCheckoutTool = {
  name: "create_gallery_checkout",
  description: "Create Stripe checkout for gallery print order",
  parameters: z.object({
    gallery_id: z.string().uuid("Valid gallery UUID required"),
    client_id: z.string().uuid("Valid client UUID required"),
    items: z.array(
      z.object({
        product_sku: z.string(),
        variant: z.record(z.any()).default({}),
        qty: z.number().int().min(1)
      })
    )
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      console.log('🛒 create_gallery_checkout: Creating Stripe checkout for gallery order');
      
      // 1. Fetch product prices
      const skus = args.items.map((i: any) => i.product_sku);
      const products = await sql`
        SELECT * FROM print_products 
        WHERE studio_id = ${ctx.studioId} 
        AND sku = ANY(${skus})
        AND is_active = true
      `;

      if (products.length === 0) {
        return {
          success: false,
          error: "No valid products found for the specified SKUs"
        };
      }

      // 2. Calculate line items and total
      let totalAmount = 0;
      const lineItems = args.items.map((item: any) => {
        const product = products.find((p: any) => p.sku === item.product_sku);
        if (!product) {
          throw new Error(`Product not found: ${item.product_sku}`);
        }
        
        const lineTotal = Number(product.base_price) * item.qty;
        totalAmount += lineTotal;
        
        return {
          product_id: product.id,
          product_sku: product.sku,
          product_name: product.name,
          variant: item.variant,
          qty: item.qty,
          unit_price: Number(product.base_price),
          line_total: lineTotal
        };
      });

      // 3. Create order record
      const orderId = crypto.randomUUID();
      await sql`
        INSERT INTO gallery_orders (
          id, studio_id, gallery_id, client_id, 
          status, total, currency
        ) VALUES (
          ${orderId}, ${ctx.studioId}, ${args.gallery_id}, ${args.client_id},
          'pending', ${totalAmount}, 'EUR'
        )
      `;

      // 4. Create order items
      for (const item of lineItems) {
        await sql`
          INSERT INTO gallery_order_items (
            order_id, product_id, variant, qty, unit_price, line_total
          ) VALUES (
            ${orderId}, ${item.product_id}, ${JSON.stringify(item.variant)}, 
            ${item.qty}, ${item.unit_price}, ${item.line_total}
          )
        `;
      }

      // 5. Generate checkout URL (mock for now - replace with actual Stripe integration)
      const checkoutUrl = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/gallery/${args.gallery_id}/checkout/${orderId}`;

      return {
        success: true,
        order_id: orderId,
        checkout_url: checkoutUrl,
        total: totalAmount,
        currency: 'EUR',
        line_items: lineItems,
        message: `Gallery checkout created successfully for €${totalAmount}`,
        next_steps: "Client can proceed to payment via the checkout URL"
      };

    } catch (error: any) {
      console.error('[create_gallery_checkout]', error);
      return {
        success: false,
        error: `Failed to create checkout: ${error.message}`
      };
    }
  }
};