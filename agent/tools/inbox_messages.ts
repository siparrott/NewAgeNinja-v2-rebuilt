
import { z } from "zod"; 
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails.js"; 
import type { AgentCtx } from "../core/ctx.js";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const readInboxMessages = {
  name: "read_inbox_messages",
  description: "Read inbox_messages",
  parameters: z.object({ limit: z.number().default(25) }),
  handler: async (a: any, ctx: AgentCtx) => 
    (await sb.from("inbox_messages").select("*").eq("studio_id", ctx.studioId).limit(a.limit)).data
};

export const createInboxMessages = {
  name: "create_inbox_messages",
  description: "Create row in inbox_messages",
  parameters: z.object({ data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "CREATE_LEAD") !== "allow") throw new Error("Nope");
    return (await sb.from("inbox_messages").insert({ ...a.data, studio_id: ctx.studioId }).select().single()).data;
  }
};

export const updateInboxMessages = {
  name: "update_inbox_messages",
  description: "Update row in inbox_messages",
  parameters: z.object({ id: z.string(), data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") throw new Error("Not allowed");
    return (await sb.from("inbox_messages").update(a.data).eq("id", a.id).eq("studio_id", ctx.studioId).select().single()).data;
  }
};
