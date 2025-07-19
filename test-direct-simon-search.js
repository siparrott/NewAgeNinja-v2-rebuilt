// Direct test of the enhanced read_crm_leads tool
import { neon } from '@neondatabase/serverless';

async function testDirectSimonSearch() {
  console.log('🧪 DIRECT SIMON SEARCH TEST');
  console.log('===========================');
  
  // Test database connection first
  console.log('1. Testing database connection...');
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const allLeads = await sql`SELECT id, name, email FROM crm_leads LIMIT 5`;
    console.log('✅ Database connected. Found', allLeads.length, 'leads total');
    console.log('📊 Sample leads:', allLeads.map(l => `${l.name} (${l.email})`).join(', '));
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // Test Simon search directly
  console.log('\n2. Testing Simon search...');
  try {
    const searchTerm = 'simon';
    const term = `%${searchTerm.toLowerCase()}%`;
    
    const simonLeads = await sql`
      SELECT * FROM crm_leads 
      WHERE (
        LOWER(name) LIKE ${term} OR 
        LOWER(email) LIKE ${term} OR 
        LOWER(message) LIKE ${term}
      )
      ORDER BY created_at DESC
    `;
    
    console.log('✅ Simon search completed');
    console.log('📊 Found', simonLeads.length, 'Simon leads');
    
    if (simonLeads.length > 0) {
      console.log('📄 Simon leads found:');
      simonLeads.forEach(lead => {
        console.log(`  - ${lead.name} (${lead.email}) - ID: ${lead.id}`);
      });
    } else {
      console.log('❌ No Simon leads found - this indicates a search issue');
    }
    
  } catch (error) {
    console.error('❌ Simon search failed:', error.message);
  }
  
  // Test enhanced tool import
  console.log('\n3. Testing enhanced tool import...');
  try {
    const { readCrmLeads } = await import('./agent/tools/read-crm-leads.ts');
    console.log('✅ Enhanced read_crm_leads tool imported successfully');
    
    // Create mock context
    const mockCtx = {
      studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
      userId: 'test-user'
    };
    
    // Test the tool directly
    const result = await readCrmLeads.handler({ search: 'simon', limit: 10 }, mockCtx);
    console.log('✅ Enhanced tool executed successfully');
    console.log('📊 Tool result:', result ? result.length : 0, 'leads found');
    
  } catch (error) {
    console.error('❌ Enhanced tool test failed:', error.message);
  }
  
  console.log('\n🏁 Direct search test complete!');
}

testDirectSimonSearch();