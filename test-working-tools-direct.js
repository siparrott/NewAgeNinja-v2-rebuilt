// Direct test of the working tools to confirm they function
import { neon } from '@neondatabase/serverless';

async function testWorkingToolsDirect() {
  console.log('🔧 TESTING WORKING TOOLS DIRECTLY');
  console.log('===============================');

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('\n1️⃣ Testing direct leads query (simulating working tool)');
    const leads = await sql`SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT 5`;
    console.log('✅ Direct leads query successful:', leads.length, 'rows');
    console.log('Sample lead:', leads[0]?.name || 'No name field');
    
    console.log('\n2️⃣ Testing direct clients query (simulating working tool)');
    const clients = await sql`SELECT * FROM crm_clients ORDER BY created_at DESC LIMIT 5`;
    console.log('✅ Direct clients query successful:', clients.length, 'rows');
    console.log('Sample client:', clients[0]?.first_name, clients[0]?.last_name || 'No name fields');
    
    console.log('\n3️⃣ Testing direct invoices query (simulating working tool)');
    const invoices = await sql`SELECT * FROM crm_invoices ORDER BY created_at DESC LIMIT 5`;
    console.log('✅ Direct invoices query successful:', invoices.length, 'rows');
    console.log('Sample invoice:', invoices[0]?.id || 'No invoice found');
    
    console.log('\n🔧 WORKING TOOLS LOGIC CONFIRMED');
    console.log('The database queries work perfectly.');
    console.log('The issue must be in tool registration, execution wrapper, or OpenAI function calling.');
    
  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
  }
}

testWorkingToolsDirect();