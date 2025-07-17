import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { aiPolicies } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export type Authority =
  | "READ_CLIENTS"
  | "READ_LEADS"
  | "READ_SESSIONS"
  | "READ_INVOICES"
  | "DRAFT_EMAIL"
  | "CREATE_LEAD"
  | "UPDATE_CLIENT"
  | "SEND_INVOICE"
  | "SEND_EMAIL";

export interface AgentPolicy {
  mode: "read_only" | "propose" | "auto_safe" | "auto_all";
  authorities: Authority[];
  invoice_auto_limit: number;
  email_send_mode: "draft" | "trusted" | "auto";
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export async function loadPolicy(studioId: string): Promise<AgentPolicy> {
  try {
    const data = await db.select().from(aiPolicies).where(eq(aiPolicies.studioId, studioId));
    
    if (!data || data.length === 0) {
      return {
        mode: "read_only",
        authorities: ["READ_CLIENTS","READ_LEADS","READ_SESSIONS","READ_INVOICES","DRAFT_EMAIL"],
        invoice_auto_limit: 0,
        email_send_mode: "draft",
      };
    }

    const policy = data[0];
    return {
      mode: policy.mode as "read_only" | "propose" | "auto_safe" | "auto_all",
      authorities: policy.authorities ?? [],
      invoice_auto_limit: Number(policy.invoice_auto_limit ?? 0),
      email_send_mode: policy.email_send_mode as "draft" | "trusted" | "auto",
    };
  } catch (error) {
    console.error("Failed to load policy:", error);
    return {
      mode: "read_only",
      authorities: ["READ_CLIENTS","READ_LEADS","READ_SESSIONS","READ_INVOICES","DRAFT_EMAIL"],
      invoice_auto_limit: 0,
      email_send_mode: "draft",
    };
  }
}