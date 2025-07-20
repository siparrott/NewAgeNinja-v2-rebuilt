import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { AgentCtx } from "../types";

const sql = neon(process.env.DATABASE_URL!);

export const replyEmailTool = {
  name: "reply_email",
  description: "Reply to a lead or client using a template. Finds the email automatically.",
  parameters: z.object({
    entity_id: z.string().describe("UUID of the lead or client"),
    template: z.string().describe("Email template content"),
    subject: z.string().optional().describe("Email subject line")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    console.log(`📧 reply_email: Replying to entity ${args.entity_id}`);
    
    try {
      // Find the email address from leads or clients
      let email = null;
      let name = null;
      
      // Try leads first
      const leadResult = await sql`
        SELECT email, name FROM crm_leads 
        WHERE id = ${args.entity_id}
        LIMIT 1
      `;
      
      if (leadResult.length > 0) {
        email = leadResult[0].email;
        name = leadResult[0].name;
      } else {
        // Try clients
        const clientResult = await sql`
          SELECT email, CONCAT(first_name, ' ', last_name) as name 
          FROM crm_clients 
          WHERE id = ${args.entity_id}
          LIMIT 1
        `;
        
        if (clientResult.length > 0) {
          email = clientResult[0].email;
          name = clientResult[0].name;
        }
      }
      
      if (!email) {
        throw new Error(`No email found for entity ${args.entity_id}`);
      }
      
      // Use the send_email tool
      const sendEmailTool = require('./email-send').emailSendTool;
      
      const emailResult = await sendEmailTool.handler({
        to: email,
        subject: args.subject || "Re: Your enquiry",
        text: args.template,
        html: `<p>${args.template.replace(/\n/g, '<br>')}</p>`
      }, ctx);
      
      console.log(`✅ reply_email: Sent reply to ${name} (${email})`);
      
      return {
        status: "sent",
        to: email,
        recipient: name,
        subject: args.subject || "Re: Your enquiry"
      };
      
    } catch (error: any) {
      console.error('❌ reply_email error:', error.message);
      throw error;
    }
  }
};