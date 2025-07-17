// Audit logging for agent actions
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { agentActionLog } from '../../shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface AgentAuditLog {
  studioId: string;
  userId: string;
  action: string;
  details: any;
  timestamp: Date;
}

export async function logAgentAction(log: AgentAuditLog) {
  try {
    await db.insert(agentActionLog).values({
      studioId: log.studioId,
      userId: log.userId, // This should be a UUID, but we'll use string for now
      actionType: log.action,
      actionDetails: log.details,
      success: true,
      // timestamp is handled by createdAt default
    });
    console.log('Agent action logged:', log.action);
  } catch (error) {
    console.error('Failed to log agent action:', error);
  }
}