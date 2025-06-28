// Script to migrate all clients from Supabase to PostgreSQL
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

const supabaseUrl = 'https://gtnwccyxwrevfnbkjvzm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bndjY3l4d3JldmZuYmtqdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgwMTgsImV4cCI6MjA2NTgyNDAxOH0.MiOeCq2NCD969D_SXQ1wAlheSvRY5h04cUnV0XNuOrc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function findClientsTable() {
  console.log('Looking for clients table in Supabase...');
  
  // Try common table names
  const possibleTables = ['clients', 'customers', 'users', 'crm_clients', 'client'];
  
  for (const tableName of possibleTables) {
    try {
      console.log(`Checking table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (!error && data) {
        console.log(`Found table ${tableName} with ${data.length} sample records`);
        console.log('Sample record structure:', Object.keys(data[0] || {}));
        return tableName;
      }
    } catch (err) {
      console.log(`Table ${tableName} not found`);
    }
  }
  
  return null;
}

async function migrateClients() {
  try {
    const tableName = await findClientsTable();
    
    if (!tableName) {
      console.log('No clients table found. Let me list all available tables...');
      
      // Try to get schema information
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (tables) {
        console.log('Available tables:', tables.map(t => t.table_name));
      }
      return;
    }
    
    console.log(`Found clients in table: ${tableName}`);
    
    // Get total count
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total clients found: ${count}`);
    
    // Clear existing clients
    await pool.query('DELETE FROM crm_clients');
    console.log('Cleared existing clients from PostgreSQL');
    
    // Migrate in batches
    const batchSize = 100;
    let offset = 0;
    let totalMigrated = 0;
    
    while (offset < count) {
      const { data: clients, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + batchSize - 1);
      
      if (error) {
        console.error('Error fetching clients:', error);
        break;
      }
      
      if (clients && clients.length > 0) {
        // Transform and insert clients
        for (const client of clients) {
          try {
            const insertQuery = `
              INSERT INTO crm_clients (
                first_name, last_name, email, phone, address, city, state, 
                zip, country, company, notes, status, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
            
            const values = [
              client.first_name || client.firstName || '',
              client.last_name || client.lastName || '',
              client.email || '',
              client.phone || client.telephone || '',
              client.address || client.address1 || client.street || '',
              client.city || '',
              client.state || client.region || '',
              client.zip || client.postal_code || client.zipcode || '',
              client.country || '',
              client.company || client.organization || '',
              client.notes || client.comment || '',
              client.status || 'active',
              client.created_at || client.createdAt || new Date().toISOString()
            ];
            
            await pool.query(insertQuery, values);
            totalMigrated++;
          } catch (insertError) {
            console.error('Error inserting client:', insertError.message);
          }
        }
        
        console.log(`Migrated ${totalMigrated}/${count} clients...`);
      }
      
      offset += batchSize;
    }
    
    console.log(`Migration complete! Total clients migrated: ${totalMigrated}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateClients();