import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import type { AgentCtx } from "../core/ctx.js";
import { submitProdigiOrder, mapProductToProdigi } from "../integrations/labs/prodigi.js";
import type { ProdigiOrder } from "../integrations/labs/types.js";

const sql = neon(process.env.DATABASE_URL!);

export const submitProdigiOrderTool = {
  name: "submit_prodigi_order",
  description: "Submit gallery order to Prodigi for print fulfillment and dropshipping",
  parameters: z.object({
    gallery_id: z.string().uuid("Valid gallery UUID required"),
    client_id: z.string().uuid("Valid client UUID required"),
    order_id: z.string().uuid("Valid gallery order UUID required").optional(),
    shipping_address: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      line1: z.string(),
      line2: z.string().optional(),
      postal_code: z.string(),
      country_code: z.string().length(2),
      city: z.string(),
      state: z.string().optional()
    }).optional()
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      console.log('🖨️ submit_prodigi_order: Processing gallery order for Prodigi fulfillment');
      
      // 1. Find the gallery order
      let galleryOrder;
      if (args.order_id) {
        const orders = await sql`
          SELECT * FROM gallery_orders 
          WHERE id = ${args.order_id} 
          AND studio_id = ${ctx.studioId}
        `;
        galleryOrder = orders[0];
      } else {
        const orders = await sql`
          SELECT * FROM gallery_orders 
          WHERE gallery_id = ${args.gallery_id} 
          AND client_id = ${args.client_id}
          AND studio_id = ${ctx.studioId}
          AND status IN ('paid', 'pending')
          ORDER BY created_at DESC
          LIMIT 1
        `;
        galleryOrder = orders[0];
      }

      if (!galleryOrder) {
        return {
          success: false,
          error: "No paid gallery order found for the specified gallery and client"
        };
      }

      // 2. Get order items with product details
      const orderItems = await sql`
        SELECT 
          goi.*,
          pp.name as product_name,
          pp.sku as product_sku
        FROM gallery_order_items goi
        JOIN print_products pp ON goi.product_id = pp.id
        WHERE goi.order_id = ${galleryOrder.id}
      `;

      if (orderItems.length === 0) {
        return {
          success: false,
          error: "No items found for gallery order"
        };
      }

      // 3. Get client details for shipping  
      const clients = await sql`
        SELECT * FROM crm_clients 
        WHERE id = ${args.client_id}
      `;
      
      const client = clients[0];
      if (!client) {
        return {
          success: false,
          error: "Client not found"
        };
      }

      // 4. Build Prodigi order
      const shippingAddress = args.shipping_address || {
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        phone: client.phone || "+43123456789", // Default phone if missing
        line1: client.address || "Vienna, Austria",
        postal_code: "1010",
        country_code: "AT",
        city: client.city || "Vienna"
      };

      // Filter out digital items (can't be physically printed)
      const physicalItems = orderItems.filter(item => 
        !item.product_sku.includes('DIGITAL')
      );

      if (physicalItems.length === 0) {
        return {
          success: false,
          error: "No physical items found for printing - order contains only digital products"
        };
      }

      const prodigiOrder: ProdigiOrder = {
        shippingMethod: 1, // Standard shipping
        idempotencyKey: `gallery-${galleryOrder.id}`,
        recipient: {
          name: shippingAddress.name,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: {
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            postalOrZipCode: shippingAddress.postal_code,
            countryCode: shippingAddress.country_code,
            townOrCity: shippingAddress.city,
            stateOrCounty: shippingAddress.state
          }
        },
        items: physicalItems.map((item: any, index: number) => ({
          merchantReference: `${galleryOrder.id}-${index + 1}`,
          sku: mapProductToProdigi(item.product_sku),
          copies: item.qty,
          sizing: "fillPrintArea",
          attributes: item.variant || {},
          assets: [{
            printArea: "default",
            url: `https://via.placeholder.com/300x400/CCCCCC/666666?text=${encodeURIComponent(item.product_name)}`
          }]
        })),
        metadata: {
          gallery_order_id: galleryOrder.id,
          client_id: args.client_id,
          gallery_id: args.gallery_id,
          studio_id: ctx.studioId
        }
      };

      // 5. Submit to Prodigi
      const prodigiResponse = await submitProdigiOrder(prodigiOrder);

      // 6. Update gallery order with Prodigi details
      await sql`
        UPDATE gallery_orders 
        SET 
          status = 'in_production',
          stripe_session_id = ${prodigiResponse.id}
        WHERE id = ${galleryOrder.id}
      `;

      return {
        success: true,
        prodigi_id: prodigiResponse.id,
        status: prodigiResponse.status,
        order_id: galleryOrder.id,
        items_submitted: physicalItems.length,
        message: `Successfully submitted order to Prodigi for fulfillment. Prodigi Order ID: ${prodigiResponse.id}`,
        tracking_info: "Order is now in production. Client will receive tracking information via email."
      };

    } catch (error: any) {
      console.error('[submit_prodigi_order]', error);
      return {
        success: false,
        error: `Failed to submit order to Prodigi: ${error.message}`
      };
    }
  }
};