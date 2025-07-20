import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('x-prodigi-signature');
    
    const evt = await req.json();
    console.log('📦 Prodigi webhook received:', evt);

    // Expected format: { id: "ord_123", status: "shipped", timestamp: "..." }
    const { id: prodigiOrderId, status } = evt;

    if (!prodigiOrderId || !status) {
      console.error('Invalid webhook payload:', evt);
      return new Response('Invalid payload', { status: 400 });
    }

    // Update gallery order status based on Prodigi order ID
    const { data, error } = await supabase
      .from('gallery_orders')
      .update({ 
        status: mapProdigiStatusToGalleryStatus(status),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', prodigiOrderId); // We store Prodigi ID in stripe_session_id field

    if (error) {
      console.error('Error updating gallery order:', error);
      return new Response('Database error', { status: 500 });
    }

    console.log(`✅ prodigi-webhook: order ${prodigiOrderId} status updated to ${status}`);

    // Optional: Send notification to client
    if (status === 'shipped' || status === 'fulfilled') {
      // TODO: Send email notification to client with tracking info
      console.log('📧 Should send shipping notification to client');
    }

    return new Response('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});

function mapProdigiStatusToGalleryStatus(prodigiStatus: string): string {
  const statusMap: Record<string, string> = {
    'received': 'in_production',
    'in_production': 'in_production', 
    'shipped': 'shipped',
    'fulfilled': 'fulfilled',
    'cancelled': 'cancelled'
  };
  
  return statusMap[prodigiStatus] || 'in_production';
}