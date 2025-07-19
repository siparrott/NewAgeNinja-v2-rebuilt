
import { z } from "zod"; 
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails"; 
import type { AgentCtx } from "../core/ctx";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const readStudioTemplates = {
  name: "read_studio_templates",
  description: "Read studio_templates",
  parameters: z.object({ limit: z.number().default(25) }),
  handler: async (a: any, ctx: AgentCtx) => 
    (await sb.from("studio_templates").select("*").eq("studio_id", ctx.studioId).limit(a.limit)).data
};

export const createStudioTemplates = {
  name: "create_studio_templates",
  description: "Create row in studio_templates",
  parameters: z.object({ data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "CREATE_LEAD") !== "allow") throw new Error("Nope");
    return (await sb.from("studio_templates").insert({ ...a.data, studio_id: ctx.studioId }).select().single()).data;
  }
};

export const updateStudioTemplates = {
  name: "update_studio_templates",
  description: "Update row in studio_templates",
  parameters: z.object({ id: z.string(), data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") throw new Error("Not allowed");
    return (await sb.from("studio_templates").update(a.data).eq("id", a.id).eq("studio_id", ctx.studioId).select().single()).data;
  }
};
