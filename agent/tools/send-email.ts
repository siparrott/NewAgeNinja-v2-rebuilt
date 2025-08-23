import { z } from "zod";
import nodemailer from "nodemailer";
import type { AgentCtx } from "../core/ctx.js";

export const sendEmailTool = {
  name: "send_email",
  description: "Send email to clients or prospects",
  parameters: z.object({
    to: z.string().email(),
    subject: z.string(),
    content: z.string(),
    cc: z.string().email().optional(),
    attachments: z.array(z.object({
      filename: z.string(),
      path: z.string().optional(),
      content: z.string().optional()
    })).optional()
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Create transporter for EasyName SMTP
      const transporter = nodemailer.createTransporter({
        host: 'smtp.easyname.com',
        port: 465,
        secure: true,
        auth: {
          user: '30840mail10',
          pass: process.env.EMAIL_PASSWORD || 'default_pass'
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Send email
      const info = await transporter.sendMail({
        from: 'hallo@newagefotografie.com',
        to: args.to,
        cc: args.cc,
        subject: args.subject,
        text: args.content,
        html: args.content.replace(/\n/g, '<br>'),
        attachments: args.attachments
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response
      };
    } catch (error) {
      console.error("Email sending error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email"
      };
    }
  }
};