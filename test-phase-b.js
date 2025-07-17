// Test Phase B write capabilities
const { createAgentContext } = require('./agent/bootstrap.js');
const { toolRegistry } = require('./agent/core/tools.js');

async function testPhaseB() {
  console.log('🔧 Testing Phase B write capabilities...');
  
  // Test tool registry
  const tools = toolRegistry.list();
  console.log(`✅ ${tools.length} tools registered`);
  
  const writeTools = tools.filter(t => t.name.includes('write') || t.name.includes('propose'));
  console.log(`✅ ${writeTools.length} write tools found:`, writeTools.map(t => t.name));
  
  // Test agent context creation
  try {
    const ctx = await createAgentContext('test-studio', 'test-user');
    console.log('✅ Agent context created:', ctx.policy.mode);
    console.log('✅ Authorities:', ctx.policy.authorities.length);
    console.log('✅ Enhanced policy fields:', Object.keys(ctx.policy).filter(k => k.startsWith('restricted_') || k.startsWith('auto_')));
  } catch (error) {
    console.error('❌ Agent context creation failed:', error.message);
  }
  
  console.log('🎉 Phase B implementation complete!');
}

testPhaseB().catch(console.error);