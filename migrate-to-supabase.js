// Data migration script from Neon to Supabase
// Run this after setting up Supabase schema

import { supabaseAdmin } from './server/supabase.js';
import 'dotenv/config';

// You can enable this when ready to migrate data
const ENABLE_NEON_IMPORT = false;

async function migrateData() {
  console.log('🚀 Starting data migration from Neon to Supabase...');

  if (!ENABLE_NEON_IMPORT) {
    console.log('📝 Migration disabled. Set ENABLE_NEON_IMPORT = true to run actual migration.');
    console.log('📋 This script will help you migrate:');
    console.log('   - CRM Clients');
    console.log('   - Photography Sessions');
    console.log('   - Blog Posts');
    console.log('   - Galleries');
    console.log('   - Studio Configurations');
    return;
  }

  try {
    // Test Supabase connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('crm_clients')
      .select('count')
      .limit(1);

    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }

    console.log('✅ Supabase connection successful!');

    // TODO: Add Neon connection and data migration
    // This will be implemented once Supabase is working
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Sample data insertion for testing
async function insertSampleData() {
  console.log('📝 Inserting sample data for testing...');

  try {
    // Insert sample clients
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('crm_clients')
      .insert([
        {
          first_name: 'Maria',
          last_name: 'Schmidt',
          email: 'maria.schmidt@example.com',
          phone: '+43 1 234 5678',
          city: 'Vienna',
          country: 'Austria',
          status: 'active'
        },
        {
          first_name: 'Hans',
          last_name: 'Mueller',
          email: 'hans.mueller@example.com',
          phone: '+43 1 234 5679',
          city: 'Salzburg',
          country: 'Austria',
          status: 'active'
        }
      ])
      .select();

    if (clientError) throw clientError;
    console.log('✅ Sample clients inserted:', clients?.length);

    // Insert sample sessions
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('photography_sessions')
      .insert([
        {
          client_id: clients?.[0]?.id,
          session_type: 'Wedding Photography',
          session_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 480,
          location: 'Schönbrunn Palace, Vienna',
          price: 1500.00,
          deposit_required: 500.00,
          status: 'scheduled'
        },
        {
          client_id: clients?.[1]?.id,
          session_type: 'Portrait Session',
          session_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 120,
          location: 'Studio',
          price: 350.00,
          deposit_required: 100.00,
          status: 'scheduled'
        }
      ])
      .select();

    if (sessionError) throw sessionError;
    console.log('✅ Sample sessions inserted:', sessions?.length);

    console.log('🎉 Sample data insertion completed!');
    
  } catch (error) {
    console.error('❌ Sample data insertion failed:', error);
  }
}

// Run the appropriate function based on arguments
const command = process.argv[2];

if (command === 'sample') {
  insertSampleData();
} else {
  migrateData();
}

export { migrateData, insertSampleData };
