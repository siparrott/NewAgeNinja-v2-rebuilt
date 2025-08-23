import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { AgentCtx } from "../types.js";

// Simple authority check function
function requireAuthority(ctx: AgentCtx, authority: string) {
  if (!ctx.policy.authorities.includes(authority as any)) {
    throw new Error(`Missing required authority: ${authority}`);
  }
}

const sql = neon(process.env.DATABASE_URL!);

export const createSessionTool = {
  name: "create_photography_session",
  description: "Create a new photography session (appointment) for a client. Can use client_id or client_email.",
  parameters: z.object({
    client_id: z.string().optional().describe("UUID of the client"),
    client_email: z.string().optional().describe("Email of the client if client_id not known"),
    start_time: z.string().describe("Start date/time in ISO 8601 format (e.g., 2025-12-23T09:00:00)"),
    end_time: z.string().optional().describe("End date/time in ISO 8601 format"),
    title: z.string().optional().describe("Session title"),
    notes: z.string().optional().describe("Additional notes for the session"),
    session_type: z.string().optional().describe("Type of photography session (family, newborn, maternity, etc.)")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    requireAuthority(ctx, "CREATE_SESSION");
    
    console.log(`📅 create_photography_session: Creating session for client ${args.client_id || args.client_email}`);
    
    try {
      // Get client info if only email provided
      let clientId = args.client_id;
      let clientEmail = args.client_email;
      
      if (!clientId && clientEmail) {
        const clientResult = await sql`
          SELECT id, first_name, last_name FROM crm_clients 
          WHERE LOWER(email) = ${clientEmail.toLowerCase()}
          LIMIT 1
        `;
        if (clientResult.length > 0) {
          clientId = clientResult[0].id;
        }
      }

      const sessionData = {
        client_id: clientId || null,
        client_email: clientEmail || null,
        start_time: args.start_time,
        end_time: args.end_time || null,
        title: args.title || `Photography Session - ${args.session_type || 'General'}`,
        notes: args.notes || null,
        session_type: args.session_type || 'general',
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await sql`
        INSERT INTO photography_sessions (
          client_id, client_email, start_time, end_time, title, notes, session_type, status, created_at, updated_at
        ) VALUES (
          ${sessionData.client_id},
          ${sessionData.client_email},
          ${sessionData.start_time},
          ${sessionData.end_time},
          ${sessionData.title},
          ${sessionData.notes},
          ${sessionData.session_type},
          ${sessionData.status},
          ${sessionData.created_at},
          ${sessionData.updated_at}
        )
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error('Failed to create photography session');
      }

      const session = result[0];
      console.log(`✅ create_photography_session: Created session ${session.id}`);
      
      return {
        status: "created",
        session: session,
        message: `Photography session "${session.title}" scheduled for ${args.start_time}`
      };
    } catch (error: any) {
      console.error('❌ create_photography_session error:', error.message);
      throw error;
    }
  }
};