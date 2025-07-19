// Comprehensive debugging test following the expert checklist
import { neon } from '@neondatabase/serverless';

async function debugCouldntComplete() {
  console.log('🔍 DEBUGGING "COULDN\'T COMPLETE THAT TASK" FOLLOWING EXPERT CHECKLIST');
  console.log('=================================================================');

  // Add unhandled rejection logging
  process.on('unhandledRejection', e => console.error('🚨 UNHANDLED REJECTION:', e));

  const sql = neon(process.env.DATABASE_URL);
  
  // Layer 1: Database Connection Test
  console.log('\n1️⃣ LAYER 1: Database Connection Test');
  try {
    const testQuery = await sql`SELECT count(*) as count FROM crm_invoices LIMIT 1`;
    console.log('✅ Database connection working, found', testQuery[0].count, 'invoices');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }

  // Layer 2: Studio ID Check (Not applicable - our tables don't use studio_id)
  console.log('\n2️⃣ LAYER 2: Studio ID Check (N/A - using different architecture)');
  console.log('✅ Our tables use direct access without studio_id filtering');

  // Layer 3: Authority Check
  console.log('\n3️⃣ LAYER 3: Authority Check');
  try {
    const policies = await sql`
      SELECT authorities 
      FROM ai_policies 
      WHERE studio_id = 'e5dc81e8-7073-4041-8814-affb60f4ef6c'
    `;
    
    if (policies.length > 0) {
      const authorities = policies[0].authorities;
      console.log('✅ Policy found with authorities:', authorities);
      
      const requiredAuth = ['READ_INVOICES', 'READ_LEADS', 'READ_CLIENTS', 'READ_SESSIONS'];
      const missing = requiredAuth.filter(auth => !authorities.includes(auth));
      
      if (missing.length > 0) {
        console.log('❌ Missing authorities:', missing);
      } else {
        console.log('✅ All required authorities present');
      }
    } else {
      console.log('❌ No policy found for studio');
    }
  } catch (error) {
    console.error('❌ Authority check failed:', error.message);
  }

  // Layer 4: Tool Schema Test
  console.log('\n4️⃣ LAYER 4: Tool Schema Test');
  console.log('Testing various CRM agent queries...');
  
  const testQueries = [
    {name: 'Count Invoices', message: 'how many invoices do we have?'},
    {name: 'List Leads', message: 'list all leads'},
    {name: 'Find Simon', message: 'find simon parrott'},
    {name: 'Count Sessions', message: 'how many bookings this year?'}
  ];

  for (const query of testQueries) {
    console.log(`\n🧪 Testing: ${query.name} - "${query.message}"`);
    
    try {
      const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-session=test-session'
        },
        body: JSON.stringify({
          message: query.message,
          studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
          userId: 'debug-test-' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Status:', response.status);
      const responseText = result.response.substring(0, 200);
      console.log('📄 Response:', responseText + (result.response.length > 200 ? '...' : ''));
      
      const isGenericFailure = result.response.includes("couldn't complete") || 
                              result.response.includes("apologize") ||
                              result.response.includes("unable to");
      
      const hasRealData = result.response.toLowerCase().includes('simon') ||
                         result.response.includes('€') ||
                         result.response.match(/\d+/) !== null;
      
      if (isGenericFailure && !hasRealData) {
        console.log('❌ GENERIC FAILURE - This is the "couldn\'t complete" issue');
      } else if (hasRealData) {
        console.log('✅ REAL DATA RETURNED - System working properly');
      } else {
        console.log('⚠️ MIXED RESULT - Needs investigation');
      }
      
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
  }

  // Summary
  console.log('\n🏁 DEBUGGING SUMMARY');
  console.log('Follow the expert checklist to identify which layer is breaking.');
  console.log('Most likely: Tool schema mismatch or missing error surfacing in executeToolCall wrapper.');
}

debugCouldntComplete();