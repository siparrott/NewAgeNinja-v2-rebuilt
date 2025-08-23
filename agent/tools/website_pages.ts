
import { z } from "zod"; 
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails.js"; 
import type { AgentCtx } from "../core/ctx.js";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const readWebsitePages = {
  name: "read_website_pages",
  description: "Read website_pages",
  parameters: z.object({ limit: z.number().default(25) }),
  handler: async (a: any, ctx: AgentCtx) => 
    (await sb.from("website_pages").select("*").eq("studio_id", ctx.studioId).limit(a.limit)).data
};

export const createWebsitePages = {
  name: "create_website_pages",
  description: "Create row in website_pages",
  parameters: z.object({ data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "CREATE_LEAD") !== "allow") throw new Error("Nope");
    return (await sb.from("website_pages").insert({ ...a.data, studio_id: ctx.studioId }).select().single()).data;
  }
};

export const updateWebsitePages = {
  name: "update_website_pages",
  description: "Update row in website_pages",
  parameters: z.object({ id: z.string(), data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") throw new Error("Not allowed");
    return (await sb.from("website_pages").update(a.data).eq("id", a.id).eq("studio_id", ctx.studioId).select().single()).data;
  }
};
