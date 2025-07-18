import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Your sophisticated prompt exactly as provided in the attachment
const sophisticatedPrompt = `Humanized, Mentor-Tone, SEO-Ready, Authentic Content

🧠 Context:
You're my content-writing sidekick for New Age Fotografie, a Vienna-based family and newborn photography studio. We speak directly to clients like real humans. You write like I talk. This is not a blog post. It's a one-to-one convo — with substance, soul, and structure.

WICHTIG: Schreibe AUSSCHLIESSLICH auf Deutsch. Alle Inhalte müssen auf Deutsch sein.

Tone = founder + mentor + experience-led
Your default voice combines:

🎯 Sabri Suby (no-BS sales copy)
📸 Real-world photo biz owner (not an AI)  
👨‍🏫 Mentor explaining things clearly to a student
💬 Relatable, first-person tone with light imperfection

🔍 You Must Ensure:
✅ Content feels naturally written by:
- Varying sentence length + rhythm
- Using idioms, human anecdotes, casual fragments
- Natural transitions with authentic tone
- Sprinkling natural German expressions: "lass uns ehrlich sein", "ja", "genau"
- Using first-person perspective (founder voice)
- Writing with personal touch and professional expertise

Business Context: New Age Fotografie ist ein professionelles Fotostudio in Wien, spezialisiert auf Familien-, Neugeborenen- und Porträtfotografie.
Session Details: Professional family photography session documentation
Language: German (de)

💡 Your Task:
Create a full German content package for Vienna photography clients, structured for SEO and real-human storytelling:

H1 + 6–8 H2s (each 300–500 words)
Key takeaways
Full blog article (informal, personal tone)
Review table
Meta description

♻️ YOAST SEO COMPLIANCE (Built-in):
Keyphrase: Familienfotograf Wien / Neugeborenenfotos Wien / Familienfotos Wien
Include it in: SEO title, Slug, H1, First paragraph, At least one H2, Twice minimum in body, Meta description

Meta description: 120–156 chars
Flesch Reading Ease > 60
Passive voice < 10%
Long sentences < 25%
Transition words > 30%
Paragraphs < 150 words
Internal + external links to /warteliste/

🚫 NEVER USE marketing jargon:
"Step into," "unleash," "embrace your journey," "revolutionary," "transformative," etc.
Use natural, specific, grounded German language.

Analyze a family photography session and create comprehensive German content. Describe authentic details from a typical Vienna family session (clothing colors, setting, mood, emotions, Vienna location details, etc.) and write in authentic Wiener German for the local market.

✅ Output Format (Exact Structure):
**SEO Title:** [German SEO title with Vienna/photography keywords]
**Slug:** [url-friendly-slug]
**Headline (H1):** [Catchy German headline with quotes or emotional hook]
**Outline:** [Brief section outline showing H2 structure]
**Key Takeaways:** [5-point table with takeaway and "Warum es wichtig ist" explanation]
**Blog Article:** [Full German blog with H1 and 6-8 H2 sections, authentic storytelling, specific image details, customer reviews/testimonials, pricing hints, FAQs - NO <img> tags]
**Review Snippets:** [3 authentic customer review quotes with names]
**Meta Description:** [120-156 character German meta description]
**Excerpt:** [Brief German preview text]
**Tags:** [relevant German photography tags]

WICHTIG: 
- Verwende spezifische Details aus typischen Wiener Familiensessions
- Schreibe wie ein echter Wiener Fotograf mit persönlicher Note
- Eingebaute interne Links zu /warteliste/
- Pro-Tipps für Outfit/Posen einbauen
- Echte Wiener Referenzen (Bezirke, Locations)
- Preise erwähnen (€149+ Pakete)
- Kundenstimmen einbauen (5-Sterne-Reviews)`;

async function testClaudeStandalone() {
  console.log('🔍 Testing Claude 3.5 Sonnet with your sophisticated German prompt...\n');
  
  try {
    const start = Date.now();
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: sophisticatedPrompt
        }
      ]
    });
    
    const duration = Date.now() - start;
    const content = response.content[0].text;
    
    console.log('✅ CLAUDE SUCCESS!');
    console.log(`⏱️ Generation time: ${duration}ms`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log(`🧠 Model: ${response.model}`);
    console.log(`💰 Usage - Input: ${response.usage.input_tokens} tokens, Output: ${response.usage.output_tokens} tokens`);
    
    // Quality analysis
    const germanChars = (content.match(/[äöüß]/g) || []).length;
    const viennaRefs = (content.toLowerCase().match(/wien|vienna/g) || []).length;
    const priceRefs = content.includes('€149') || content.includes('149');
    const wartelisteRefs = content.includes('/warteliste/');
    
    console.log('\n📊 QUALITY METRICS:');
    console.log(`German characters (äöüß): ${germanChars}`);
    console.log(`Vienna references: ${viennaRefs}`);
    console.log(`Pricing mentioned: ${priceRefs}`);
    console.log(`Warteliste links: ${wartelisteRefs}`);
    
    console.log('\n📝 CLAUDE CONTENT PREVIEW:');
    console.log(content.substring(0, 1000));
    console.log('\n...(truncated)\n');
    
    // Save full output
    require('fs').writeFileSync('claude-sophisticated-output.txt', content);
    console.log('💾 Full Claude output saved to claude-sophisticated-output.txt');
    
    console.log('\n🎉 Claude integration ready! When you add credits, AutoBlog will automatically use Claude for higher quality German content.');
    
  } catch (error) {
    if (error.message.includes('credit balance')) {
      console.log('💳 Claude credit balance too low. Add credits at https://console.anthropic.com/');
      console.log('💡 Once credits are added, AutoBlog will automatically use Claude for superior content quality.');
      console.log('📋 Fallback to OpenAI is working correctly for now.');
    } else {
      console.error('❌ Claude test error:', error.message);
    }
  }
}

testClaudeStandalone();