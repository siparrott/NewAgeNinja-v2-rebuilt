// CRM data integration layer - Direct PostgreSQL access for better performance
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { crmClients, crmLeads, photographySessions, crmInvoices } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function fetchTable(table: any, studioId: string) {
  // Note: Since this is a single-studio system, we'll fetch all data
  // In a true multi-studio system, this would filter by studio_id
  const data = await db.select().from(table);
  return data;
}

export const getClientsForStudio = (sid: string) => fetchTable(crmClients, sid);
export const getLeadsForStudio   = (sid: string) => fetchTable(crmLeads, sid);
export const getSessionsForStudio= (sid: string) => fetchTable(photographySessions, sid);
export const getInvoicesForStudio= (sid: string) => fetchTable(crmInvoices, sid);