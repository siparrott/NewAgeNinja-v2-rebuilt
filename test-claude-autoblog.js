import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test prompt for German photography content
const testPrompt = `Du bist ein professioneller Content-Writer für New Age Fotografie, ein Wiener Fotostudio für Familien- und Neugeborenenfotografie.

WICHTIG: Schreibe AUSSCHLIESSLICH auf Deutsch. Alle Inhalte müssen auf Deutsch sein.

Erstelle strukturierten Content für Wiener Fotografie-Kunden:

Business Context: New Age Fotografie ist ein professionelles Fotostudio in Wien, spezialisiert auf Familien-, Neugeborenen- und Porträtfotografie.

Erstelle einen Blog-Artikel über eine Familienfotosession mit folgender Struktur:

**SEO Title:** [German SEO title with Vienna/photography keywords]
**Slug:** [url-friendly-slug]
**Headline (H1):** [Catchy German headline]
**Blog Article:** [Full German blog with H1 and 4-6 H2 sections about family photography in Vienna, 800-1200 words]
**Meta Description:** [120-156 character German meta description]
**Tags:** [relevant German photography tags]

WICHTIG: 
- Analysiere Familienfotos und verwende Details
- Schreibe professionell und natürlich auf Deutsch
- Verwende Wien-spezifische Referenzen
- Erwähne Preise ab €149
- Verlinke zu /warteliste/ für Buchungen
- Schreibe authentisch für Wiener Familien mit persönlichem Ton`;

async function testClaude() {
  console.log('🔍 Testing Claude 3.5 Sonnet for German content generation...\n');
  
  try {
    const start = Date.now();
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Latest Claude model
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: testPrompt
        }
      ]
    });
    
    const duration = Date.now() - start;
    const content = response.content[0].text;
    
    console.log('✅ CLAUDE RESULTS:');
    console.log(`⏱️ Generation time: ${duration}ms`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log(`🧠 Model: ${response.model}`);
    console.log(`💰 Usage - Input tokens: ${response.usage.input_tokens}, Output tokens: ${response.usage.output_tokens}`);
    console.log('\n📝 CLAUDE CONTENT PREVIEW:');
    console.log(content.substring(0, 800) + '...\n');
    
    // Save Claude output
    fs.writeFileSync('claude-output.txt', content);
    console.log('💾 Full Claude output saved to claude-output.txt\n');
    
    return {
      provider: 'Claude',
      model: response.model,
      content,
      duration,
      usage: response.usage
    };
    
  } catch (error) {
    console.error('❌ Claude test failed:', error.message);
    return null;
  }
}

async function testOpenAI() {
  console.log('🔍 Testing OpenAI GPT-4o for comparison...\n');
  
  try {
    const start = Date.now();
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional photography content writer. Create structured German content using the exact format provided."
        },
        {
          role: "user",
          content: testPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });
    
    const duration = Date.now() - start;
    const content = response.choices[0].message.content;
    
    console.log('✅ OPENAI RESULTS:');
    console.log(`⏱️ Generation time: ${duration}ms`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log(`🧠 Model: ${response.model}`);
    console.log(`💰 Usage - Prompt tokens: ${response.usage.prompt_tokens}, Completion tokens: ${response.usage.completion_tokens}`);
    console.log('\n📝 OPENAI CONTENT PREVIEW:');
    console.log(content.substring(0, 800) + '...\n');
    
    // Save OpenAI output
    fs.writeFileSync('openai-output.txt', content);
    console.log('💾 Full OpenAI output saved to openai-output.txt\n');
    
    return {
      provider: 'OpenAI',
      model: response.model,
      content,
      duration,
      usage: response.usage
    };
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    return null;
  }
}

async function compareResults() {
  console.log('🚀 AUTOBLOG LLM COMPARISON TEST\n');
  console.log('Testing German photography content generation quality...\n');
  
  const [claudeResult, openaiResult] = await Promise.all([
    testClaude(),
    testOpenAI()
  ]);
  
  console.log('📊 COMPARISON SUMMARY:');
  console.log('='.repeat(60));
  
  if (claudeResult && openaiResult) {
    console.log(`Claude length: ${claudeResult.content.length} chars | OpenAI length: ${openaiResult.content.length} chars`);
    console.log(`Claude time: ${claudeResult.duration}ms | OpenAI time: ${openaiResult.duration}ms`);
    
    // Quality analysis
    const claudeGerman = (claudeResult.content.match(/[äöüß]/g) || []).length;
    const openaiGerman = (openaiResult.content.match(/[äöüß]/g) || []).length;
    
    const claudeVienna = (claudeResult.content.toLowerCase().match(/wien|vienna/g) || []).length;
    const openaiVienna = (openaiResult.content.toLowerCase().match(/wien|vienna/g) || []).length;
    
    const claudePricing = claudeResult.content.includes('€149') || claudeResult.content.includes('149');
    const openaiPricing = openaiResult.content.includes('€149') || openaiResult.content.includes('149');
    
    console.log('\n🔍 QUALITY METRICS:');
    console.log(`German chars (äöüß): Claude ${claudeGerman} | OpenAI ${openaiGerman}`);
    console.log(`Vienna mentions: Claude ${claudeVienna} | OpenAI ${openaiVienna}`);
    console.log(`Pricing mentioned: Claude ${claudePricing} | OpenAI ${openaiPricing}`);
    
    console.log('\n🏆 RECOMMENDATION:');
    const claudeScore = claudeResult.content.length + (claudeGerman * 2) + (claudeVienna * 10) + (claudePricing ? 50 : 0);
    const openaiScore = openaiResult.content.length + (openaiGerman * 2) + (openaiVienna * 10) + (openaiPricing ? 50 : 0);
    
    if (claudeScore > openaiScore) {
      console.log(`✅ Claude 3.5 Sonnet performs better (score: ${claudeScore} vs ${openaiScore})`);
      console.log('Consider migrating AutoBlog to use Claude for higher quality German content.');
    } else {
      console.log(`✅ OpenAI GPT-4o performs better (score: ${openaiScore} vs ${claudeScore})`);
      console.log('Current OpenAI implementation appears optimal.');
    }
  }
  
  console.log('\n📁 Review the full outputs in claude-output.txt and openai-output.txt files.');
}

// Run the comparison
compareResults().catch(console.error);