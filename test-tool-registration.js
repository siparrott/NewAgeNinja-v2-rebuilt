// Test tool registration and execution
import { toolRegistry } from './agent/core/tools.js';

async function testToolRegistration() {
  console.log('🔧 TESTING TOOL REGISTRATION');
  console.log('============================');
  
  // Check tool registry
  console.log('1. Checking tool registry...');
  const allTools = Array.from(toolRegistry.keys());
  console.log('📊 Registered tools:', allTools.length);
  console.log('📋 Tool names:', allTools.join(', '));
  
  // Check for enhanced tools
  const enhancedTools = allTools.filter(name => 
    name.includes('read_crm_leads') || 
    name.includes('find_lead') || 
    name.includes('enumerate_leads_basic')
  );
  
  console.log('\n2. Enhanced lead tools found:', enhancedTools.length);
  enhancedTools.forEach(tool => console.log('  ✅', tool));
  
  // Test read_crm_leads specifically
  console.log('\n3. Testing read_crm_leads tool...');
  try {
    const readTool = toolRegistry.get('read_crm_leads');
    if (readTool) {
      console.log('✅ read_crm_leads tool found in registry');
      console.log('📄 Tool description:', readTool.description);
      
      // Create mock context
      const mockCtx = {
        studioId: 'e5dc81e8-7073-4041-8814-affb60f4ef6c',
        userId: 'test-user',
        policy: { authorities: ['READ_LEADS'] }
      };
      
      // Test tool execution
      const result = await readTool.handler({ search: 'simon', limit: 5 }, mockCtx);
      console.log('✅ Tool executed successfully');
      console.log('📊 Result type:', typeof result);
      console.log('📊 Result length:', Array.isArray(result) ? result.length : 'not array');
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('🎉 SUCCESS: Tool returning data!');
        result.forEach(lead => {
          console.log(`  - ${lead.name} (${lead.email})`);
        });
      } else {
        console.log('⚠️ Tool returns empty or null - checking database directly');
      }
      
    } else {
      console.log('❌ read_crm_leads tool NOT found in registry');
    }
  } catch (error) {
    console.error('❌ Tool test failed:', error.message);
  }
  
  console.log('\n🏁 Tool registration test complete!');
}

testToolRegistration();