import { z } from "zod";
import type { AgentCtx } from "../core/ctx";
import { requireAuthority } from "../core/authz";
import { auditLogExecution, auditLogFailure } from "../core/audit";
import { createSuccessResponse, createErrorResponse } from "../core/proposals";
import type { ProposalResponse } from "../core/proposals";
import nodemailer from 'nodemailer';

export const emailSendTool = {
  name: "send_email",
  description: "Send email immediately using configured SMTP server. Use this tool when user asks to send or confirm an email. Requires SEND_EMAIL authority.",
  parameters: z.object({
    to: z.string().email("Valid recipient email is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Email body is required"),
    fromName: z.string().optional().default("New Age Fotografie"),
    priority: z.enum(["low", "normal", "high"]).default("normal"),
    isHtml: z.boolean().default(false)
  }),
  handler: async (args: any, ctx: AgentCtx): Promise<ProposalResponse> => {
    try {
      // Check authority
      requireAuthority(ctx, "SEND_EMAIL");

      // Create SMTP transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.easyname.com',
        port: 465,
        secure: true,
        auth: {
          user: '30840mail10',
          pass: process.env.EMAIL_PASSWORD || 'default-password'
        }
      });

      // Email options
      const mailOptions = {
        from: `${args.fromName} <hallo@newagefotografie.com>`,
        to: args.to,
        subject: args.subject,
        [args.isHtml ? 'html' : 'text']: args.body,
        priority: args.priority
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      
      await auditLogExecution(
        ctx.studioId,
        ctx.userId,
        "send_email",
        "email_sent",
        null,
        null,
        {
          to: args.to,
          subject: args.subject,
          messageId: info.messageId,
          response: info.response
        }
      );

      return createSuccessResponse(
        {
          messageId: info.messageId,
          response: info.response,
          to: args.to,
          subject: args.subject
        },
        `Email successfully sent to ${args.to}`
      );

    } catch (error) {
      console.error("Email sending failed:", error);
      await auditLogFailure(ctx.studioId, ctx.userId, "send_email", "email_sent", error, args);
      return createErrorResponse(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};