// Direct test of the CRM tools to identify the exact issue
import { neon } from '@neondatabase/serverless';

async function testCrmToolsFix() {
  console.log('🔧 TESTING CRM TOOLS FIX - FOLLOWING EXPERT CHECKLIST');
  console.log('=======================================================');

  const sql = neon(process.env.DATABASE_URL);
  
  // Test 1: Direct database query to confirm data exists
  console.log('\n1️⃣ Direct Database Test');
  try {
    const leads = await sql`SELECT count(*) as count FROM crm_leads`;
    const clients = await sql`SELECT count(*) as count FROM crm_clients`;
    const invoices = await sql`SELECT count(*) as count FROM crm_invoices`;
    
    console.log('✅ Leads in database:', leads[0].count);
    console.log('✅ Clients in database:', clients[0].count);
    console.log('✅ Invoices in database:', invoices[0].count);
  } catch (error) {
    console.error('❌ Database query failed:', error.message);
    return;
  }

  // Test 2: Simulate the exact tool handler logic
  console.log('\n2️⃣ Simulating Tool Handler Logic');
  
  try {
    // Simulate readCrmLeads handler
    const args = { limit: 25 };
    let query = `SELECT * FROM crm_leads`;
    const params = [];
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(args.limit);
    
    console.log('Query to execute:', query);
    console.log('Params:', params);
    
    // Test different SQL execution methods
    console.log('\n🔧 Testing SQL execution methods:');
    
    // Method 1: Template literal (should work)
    const result1 = await sql`SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT 5`;
    console.log('Method 1 (template literal):', result1.length, 'rows');
    
    // Method 2: Template literal with variable
    const limit = 5;
    const result2 = await sql`SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT ${limit}`;
    console.log('Method 2 (template with variable):', result2.length, 'rows');
    
    // Method 3: unsafe (parameterized - what was failing)
    try {
      const result3 = await sql.unsafe(query, params);
      console.log('Method 3 (unsafe parameterized):', result3?.length || 'null/undefined', 'rows');
    } catch (error) {
      console.log('Method 3 failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Tool simulation failed:', error.message);
  }

  // Test 3: Test the actual corrected tool approach
  console.log('\n3️⃣ Testing Corrected Tool Approach');
  
  try {
    const args = { limit: 25 };
    let result;
    
    // This is the corrected approach from the fix
    if (!args.search && !args.status) {
      result = await sql`SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT ${args.limit}`;
    }
    
    console.log('✅ Corrected approach result:', result.length, 'leads');
    console.log('Sample lead:', result[0]?.name || 'No name field');
    
  } catch (error) {
    console.error('❌ Corrected approach failed:', error.message);
  }

  console.log('\n🏁 ANALYSIS COMPLETE');
  console.log('The issue was likely parameterized queries not working with Neon template literals.');
  console.log('Fixed approach uses direct template literals for simple cases.');
}

testCrmToolsFix();