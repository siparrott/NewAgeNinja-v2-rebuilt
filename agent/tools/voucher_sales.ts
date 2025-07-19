
import { z } from "zod"; 
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails"; 
import type { AgentCtx } from "../core/ctx";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const readVoucherSales = {
  name: "read_voucher_sales",
  description: "Read voucher_sales",
  parameters: z.object({ limit: z.number().default(25) }),
  handler: async (a: any, ctx: AgentCtx) => 
    (await sb.from("voucher_sales").select("*").eq("studio_id", ctx.studioId).limit(a.limit)).data
};

export const createVoucherSales = {
  name: "create_voucher_sales",
  description: "Create row in voucher_sales",
  parameters: z.object({ data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "CREATE_LEAD") !== "allow") throw new Error("Nope");
    return (await sb.from("voucher_sales").insert({ ...a.data, studio_id: ctx.studioId }).select().single()).data;
  }
};

export const updateVoucherSales = {
  name: "update_voucher_sales",
  description: "Update row in voucher_sales",
  parameters: z.object({ id: z.string(), data: z.record(z.any()) }),
  handler: async (a: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") throw new Error("Not allowed");
    return (await sb.from("voucher_sales").update(a.data).eq("id", a.id).eq("studio_id", ctx.studioId).select().single()).data;
  }
};
