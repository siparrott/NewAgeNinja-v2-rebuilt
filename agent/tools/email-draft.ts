import { z } from "zod";
import type { AgentCtx } from "../core/ctx";
import { requireAuthority } from "../core/authz";
import { openaiForStudio } from "../core/openai";

export const draftEmailTool = {
  name: "draft_email",
  description: "Draft an email for a client or lead using AI assistance.",
  parameters: z.object({
    to: z.string().email("Valid email address required"),
    subject: z.string().min(1, "Subject is required"),
    context: z.string().optional().describe("Additional context about the email purpose"),
    tone: z.enum(["professional", "friendly", "casual", "formal"]).default("professional"),
    type: z.enum(["follow_up", "booking_confirmation", "invoice_reminder", "thank_you", "custom"]).default("custom"),
    includeStudioInfo: z.boolean().default(true),
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "DRAFT_EMAIL");
    
    const openai = openaiForStudio(ctx.creds);
    
    const systemPrompt = `You are an email assistant for ${ctx.studioName}, a professional photography studio. 
    Draft emails that are ${args.tone} in tone and appropriate for a photography business.
    
    ${args.includeStudioInfo ? `
    Studio Information:
    - Name: ${ctx.studioName}
    - Email: ${ctx.creds.smtp?.from || "studio@example.com"}
    - Currency: ${ctx.creds.currency || "EUR"}
    ` : ""}
    
    Email Type: ${args.type}
    ${args.context ? `Context: ${args.context}` : ""}
    
    Write a complete email with appropriate greeting, body, and closing.
    Keep it professional yet warm, appropriate for a photography business.
    `;

    const userPrompt = `Please draft an email with the following details:
    - To: ${args.to}
    - Subject: ${args.subject}
    - Tone: ${args.tone}
    - Type: ${args.type}
    ${args.context ? `- Context: ${args.context}` : ""}
    
    Generate a complete email that would be appropriate to send to a photography client or lead.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const emailContent = response.choices[0].message.content;

      return {
        draft: {
          to: args.to,
          subject: args.subject,
          body: emailContent,
          tone: args.tone,
          type: args.type,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          studioId: ctx.studioId,
          studioName: ctx.studioName,
          assistantUsed: "gpt-4o",
        },
        note: "This is a draft email. Please review before sending."
      };
    } catch (error) {
      throw new Error(`Failed to generate email draft: ${error.message}`);
    }
  }
};