import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { allowWrite } from "../core/guardrails";
import type { AgentCtx } from "../core/ctx";

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const convertLeadTool = {
  name: "convert_lead",
  description: "Convert a lead to a client",
  parameters: z.object({
    leadId: z.string(),
    clientData: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      notes: z.string().optional()
    })
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    if (allowWrite(ctx, "UPDATE_CLIENT") !== "allow") {
      throw new Error("Not authorized to convert leads");
    }

    try {
      // Get the lead
      const { data: lead } = await sb
        .from("crm_leads")
        .select("*")
        .eq("id", args.leadId)
        .eq("studio_id", ctx.studioId)
        .single();

      if (!lead) {
        throw new Error("Lead not found");
      }

      // Create client from lead data
      const { data: client } = await sb
        .from("crm_clients")
        .insert({
          ...args.clientData,
          studio_id: ctx.studioId,
          lead_source: lead.source || "converted"
        })
        .select()
        .single();

      // Update lead status
      await sb
        .from("crm_leads")
        .update({ 
          status: "converted",
          converted_to_client_id: client.id
        })
        .eq("id", args.leadId);

      return {
        success: true,
        clientId: client.id,
        leadId: args.leadId,
        message: `Lead converted to client: ${args.clientData.firstName} ${args.clientData.lastName}`
      };
    } catch (error) {
      console.error("Lead conversion error:", error);
      throw new Error(`Failed to convert lead: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
};