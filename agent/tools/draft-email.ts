import { z } from "zod";
import { ToolHandler } from "../core/types.js";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export const draftEmailTool: ToolHandler = {
  name: "draft_email",
  description: "Compose but do NOT send an email to a lead or client. Creates a draft for review.",
  parameters: z.object({
    lead_id: z.string().describe("ID of the lead/client to email"),
    subject: z.string().describe("Email subject line"),
    body_markdown: z.string().describe("Email body content in markdown format")
  }),
  handler: async (args, context) => {
    try {
      // Get the lead/client email address
      const leadResult = await sql`
        SELECT email, name 
        FROM crm_leads 
        WHERE id = ${args.lead_id}
        LIMIT 1
      `;

      if (leadResult.length === 0) {
        // Try clients table if not found in leads
        const clientResult = await sql`
          SELECT email, first_name, last_name 
          FROM crm_clients 
          WHERE id = ${args.lead_id}
          LIMIT 1
        `;
        
        if (clientResult.length === 0) {
          return {
            success: false,
            error: "Contact not found with that ID"
          };
        }
      }

      const contact = leadResult[0] || await sql`
        SELECT email, first_name, last_name 
        FROM crm_clients 
        WHERE id = ${args.lead_id}
        LIMIT 1
      `[0];

      // Convert markdown to HTML (simple conversion)
      const bodyHtml = args.body_markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

      // Save as draft in emails table with draft status
      const draftResult = await sql`
        INSERT INTO emails (
          studio_id,
          to_email,
          subject,
          body_html,
          body_text,
          status,
          created_at
        ) VALUES (
          ${context.studioId},
          ${contact.email},
          ${args.subject},
          ${bodyHtml},
          ${args.body_markdown},
          'draft',
          NOW()
        )
        RETURNING id
      `;

      return {
        success: true,
        draft_id: draftResult[0].id,
        message: `Draft email created for ${contact.first_name} ${contact.last_name} (${contact.email})`,
        preview: {
          to: `${contact.first_name} ${contact.last_name} <${contact.email}>`,
          subject: args.subject,
          body: args.body_markdown
        }
      };

    } catch (error) {
      console.error('Draft email error:', error);
      return {
        success: false,
        error: `Failed to create email draft: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};