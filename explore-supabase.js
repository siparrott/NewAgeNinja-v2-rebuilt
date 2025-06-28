// Script to explore all tables in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtnwccyxwrevfnbkjvzm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bndjY3l4d3JldmZuYmtqdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgwMTgsImV4cCI6MjA2NTgyNDAxOH0.MiOeCq2NCD969D_SXQ1wAlheSvRY5h04cUnV0XNuOrc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exploreSupabase() {
  try {
    console.log('Exploring Supabase database structure...');
    
    // List of potential client/customer table names
    const possibleTables = [
      'clients', 'customers', 'users', 'crm_clients', 'client', 'customer',
      'members', 'contacts', 'people', 'leads', 'prospects', 'accounts',
      'parties', 'individuals', 'persons', 'clienten', 'kunden', 'kontakte',
      'photography_clients', 'photo_clients', 'studio_clients'
    ];
    
    const foundTables = [];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(3);
        
        if (!error && data !== null) {
          console.log(`\n✅ Table: ${tableName}`);
          console.log(`   Record count: ${count || 'Unknown'}`);
          
          if (data.length > 0) {
            console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
            console.log(`   Sample record:`, JSON.stringify(data[0], null, 2));
          }
          
          foundTables.push({
            name: tableName,
            count: count || 0,
            columns: data.length > 0 ? Object.keys(data[0]) : []
          });
        }
      } catch (err) {
        // Table doesn't exist, continue
      }
    }
    
    console.log('\n📊 Summary of found tables:');
    foundTables.forEach(table => {
      console.log(`- ${table.name}: ${table.count} records`);
    });
    
    // Find the table with the most records
    const largestTable = foundTables.reduce((max, table) => 
      table.count > max.count ? table : max, { count: 0 });
    
    if (largestTable.count > 0) {
      console.log(`\n🎯 Largest table: ${largestTable.name} with ${largestTable.count} records`);
      
      // Get a better sample from the largest table
      const { data: sampleData } = await supabase
        .from(largestTable.name)
        .select('*')
        .limit(5);
      
      if (sampleData && sampleData.length > 0) {
        console.log('\n📋 Sample records from largest table:');
        sampleData.forEach((record, index) => {
          console.log(`Record ${index + 1}:`, JSON.stringify(record, null, 2));
        });
      }
    }
    
    // Also try to search using RPC or direct SQL if available
    try {
      console.log('\n🔍 Trying to find tables with RPC...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_table_info')
        .select();
      
      if (!rpcError && rpcData) {
        console.log('RPC table info:', rpcData);
      }
    } catch (rpcErr) {
      console.log('RPC not available');
    }
    
  } catch (error) {
    console.error('Exploration failed:', error);
  }
}

exploreSupabase();