
import { z } from "zod"; 
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails"; 
import type { AgentCtx } from "../core/ctx";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const readPhotographySessions = {
  name: "read_photography_sessions",
  description: "Read photography_sessions",
  parameters: z.object({ limit: z.number().default(25) }),
  handler: async (a: any, ctx: AgentCtx) => 
    (await sb.from("photography_sessions").select("*").eq("studio_id", ctx.studioId).limit(a.limit)).data
};

export const createPhotographySessions = {
  name: "create_photography_sessions",
  description: "Create row in photography_sessions",
  parameters: z.object({ data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "CREATE_LEAD") !== "allow") throw new Error("Nope");
    return (await sb.from("photography_sessions").insert({ ...a.data, studio_id: ctx.studioId }).select().single()).data;
  }
};

export const updatePhotographySessions = {
  name: "update_photography_sessions",
  description: "Update row in photography_sessions",
  parameters: z.object({ id: z.string(), data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") throw new Error("Not allowed");
    return (await sb.from("photography_sessions").update(a.data).eq("id", a.id).eq("studio_id", ctx.studioId).select().single()).data;
  }
};
