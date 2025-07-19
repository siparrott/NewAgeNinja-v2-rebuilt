// Test direct database access to verify Simon Parrott emails
import { neon } from '@neondatabase/serverless';

async function testDirectDatabase() {
  console.log('🗄️ TESTING DIRECT DATABASE ACCESS');
  console.log('=================================');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Test 1: Check Simon Parrott entries
    console.log('📝 Test 1: Find all Simon Parrott entries...');
    const simonResults = await sql`
      SELECT name, email, id FROM crm_leads 
      WHERE LOWER(name) LIKE '%simon%' AND LOWER(name) LIKE '%parrott%'
    `;
    
    console.log('✅ Simon Parrott Results:');
    simonResults.forEach((row, i) => {
      console.log(`  ${i+1}. Name: "${row.name}", Email: "${row.email}", ID: ${row.id}`);
      console.log(`     Email Valid: ${row.email.includes('@') ? 'YES' : 'NO'}`);
    });
    
    // Test 2: Test global search query
    console.log('\n📝 Test 2: Test global search simulation...');
    const searchResults = await sql`
      SELECT * FROM crm_leads 
      WHERE (LOWER(name) LIKE '%simon parrott%' OR LOWER(email) LIKE '%simon parrott%' OR LOWER(phone) LIKE '%simon parrott%')
      AND id IS NOT NULL
      LIMIT 10
    `;
    
    console.log(`✅ Global Search Results: ${searchResults.length} found`);
    searchResults.forEach((row, i) => {
      console.log(`  ${i+1}. "${row.name}" - ${row.email}`);
    });
    
    // Test 3: Check for malformed emails
    console.log('\n📝 Test 3: Check for malformed emails...');
    const malformedEmails = await sql`
      SELECT name, email FROM crm_leads 
      WHERE email IS NOT NULL AND email NOT LIKE '%@%'
      LIMIT 5
    `;
    
    console.log(`✅ Malformed Emails: ${malformedEmails.length} found`);
    malformedEmails.forEach((row, i) => {
      console.log(`  ${i+1}. "${row.name}" - "${row.email}" (MISSING @)`);
    });
    
    console.log('\n🎉 ALL DATABASE TESTS COMPLETE');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDirectDatabase();