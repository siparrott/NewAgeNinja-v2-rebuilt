import cron from "node-cron";
import { sendEmail } from "../../agent/integrations/email";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/* daily report 07:00 */
cron.schedule("0 7 * * *", async () => {
  const { count: leads } = await sb.from("crm_leads").select("*", { count: "exact", head: true });
  await sendEmail({
    to: "owner@studio.com",
    subject: "Daily report",
    html: `<h3>New leads yesterday: ${leads ?? 0}</h3>`
  });
}, { timezone: process.env.TZ || "UTC" });

/* flush email queue every minute */
cron.schedule("*/1 * * * *", async () => {
  const { data } = await sb.from("email_outbox").select("*").eq("status", "queued").limit(20);
  for (const m of data || []) {
    try {
      await sendEmail({ to: m.to_email, subject: m.subject, html: m.body_html });
      await sb.from("email_outbox").update({ status: "sent" }).eq("id", m.id);
    } catch {
      await sb.from("email_outbox").update({ status: "failed" }).eq("id", m.id);
    }
  }
});