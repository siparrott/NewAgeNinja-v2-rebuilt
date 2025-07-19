// Debug OpenAI SDK parameter order issue
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function debugSDKParameters() {
  console.log('🔍 Debugging OpenAI SDK parameter order...');
  
  try {
    // Create a thread to get valid IDs
    const thread = await openai.beta.threads.create();
    console.log('✅ Thread created:', thread.id);
    
    // Add a message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Test message"
    });
    console.log('✅ Message added');
    
    // Create a run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: 'asst_nlyO3yRav2oWtyTvkq0cHZaU'
    });
    console.log('✅ Run created:', run.id);
    
    // Test retrieve with correct parameter order
    console.log('🧪 Testing threads.runs.retrieve(threadId, runId)...');
    const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log('✅ SDK call successful with parameters:', { threadId: thread.id, runId: run.id });
    console.log('✅ Run status:', runStatus.status);
    
  } catch (error) {
    console.error('❌ SDK Error:', error.message);
    console.error('❌ Error type:', error.constructor.name);
  }
}

debugSDKParameters().catch(console.error);