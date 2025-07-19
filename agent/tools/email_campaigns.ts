
import { z } from "zod"; 
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails"; 
import type { AgentCtx } from "../core/ctx";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const readEmailCampaigns = {
  name: "read_email_campaigns",
  description: "Read email_campaigns",
  parameters: z.object({ limit: z.number().default(25) }),
  handler: async (a: any, ctx: AgentCtx) => 
    (await sb.from("email_campaigns").select("*").eq("studio_id", ctx.studioId).limit(a.limit)).data
};

export const createEmailCampaigns = {
  name: "create_email_campaigns",
  description: "Create row in email_campaigns",
  parameters: z.object({ data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "CREATE_LEAD") !== "allow") throw new Error("Nope");
    return (await sb.from("email_campaigns").insert({ ...a.data, studio_id: ctx.studioId }).select().single()).data;
  }
};

export const updateEmailCampaigns = {
  name: "update_email_campaigns",
  description: "Update row in email_campaigns",
  parameters: z.object({ id: z.string(), data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") throw new Error("Not allowed");
    return (await sb.from("email_campaigns").update(a.data).eq("id", a.id).eq("studio_id", ctx.studioId).select().single()).data;
  }
};
