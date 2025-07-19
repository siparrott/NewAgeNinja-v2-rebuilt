import { promises as fs } from "fs";

const tables = [
  "crm_leads", "crm_clients", "crm_invoices", "photography_sessions", "galleries",
  "blog_posts", "email_campaigns", "voucher_sales", "top_clients", "digital_files",
  "ai_autoblog", "inbox_messages", "questionnaires", "reports",
  "studio_settings", "studio_templates", "website_pages"
];

for (const t of tables) {
  const P = t.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
  await fs.writeFile(`agent/tools/${t}.ts`, `
import { z } from "zod"; 
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails"; 
import type { AgentCtx } from "../core/ctx";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const read${P} = {
  name: "read_${t}",
  description: "Read ${t}",
  parameters: z.object({ limit: z.number().default(25) }),
  handler: async (a: any, ctx: AgentCtx) => 
    (await sb.from("${t}").select("*").eq("studio_id", ctx.studioId).limit(a.limit)).data
};

export const create${P} = {
  name: "create_${t}",
  description: "Create row in ${t}",
  parameters: z.object({ data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "CREATE_LEAD") !== "allow") throw new Error("Nope");
    return (await sb.from("${t}").insert({ ...a.data, studio_id: ctx.studioId }).select().single()).data;
  }
};

export const update${P} = {
  name: "update_${t}",
  description: "Update row in ${t}",
  parameters: z.object({ id: z.string(), data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") throw new Error("Not allowed");
    return (await sb.from("${t}").update(a.data).eq("id", a.id).eq("studio_id", ctx.studioId).select().single()).data;
  }
};
`);
}

console.log("CRUD tools generated");