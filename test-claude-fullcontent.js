import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function testClaudeFullContent() {
  console.log('🔍 Testing Claude with full content requirement...\n');
  
  const directPrompt = `Du bist ein erfahrener Familienfotograf in Wien für New Age Fotografie.

AUFGABE: Schreibe einen VOLLSTÄNDIGEN deutschen Blog-Artikel (1500+ Wörter) über Familienfotografie in Wien.

WICHTIG: Schreibe den KOMPLETTEN Artikel in einer Antwort. Frage NICHT ob du fortfahren sollst.

FORMAT:
**SEO Title:** [Title]
**Slug:** [slug]  
**Headline (H1):** [H1]
**Blog Article:**
[KOMPLETTER deutscher Blog-Artikel mit H1 und 6-8 H2-Abschnitten]
[Schreibe mindestens 1500 Wörter über Familienfotografie in Wien]
[Verwende persönlichen Ton und echte Wiener Details]
[Preise €149+ erwähnen und /warteliste/ Link einbauen]
**Meta Description:** [Description]
**Excerpt:** [Excerpt]
**Tags:** [Tags mit Komma getrennt]

Schreibe jetzt den VOLLSTÄNDIGEN Artikel ohne zu fragen ob du fortfahren sollst!`;
  
  try {
    console.log('Sending direct prompt to Claude...');
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: directPrompt
        }
      ]
    });
    
    const content = response.content[0].text;
    console.log('\n✅ Claude Full Response:');
    console.log('='.repeat(80));
    console.log(content);
    console.log('='.repeat(80));
    console.log(`Total Length: ${content.length} characters`);
    
    // Extract just the Blog Article section
    const blogMatch = content.match(/\*\*Blog Article:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*Meta Description|\*\*Excerpt|\*\*Tags|$)/i);
    if (blogMatch) {
      const blogContent = blogMatch[1].trim();
      console.log(`\n📝 Blog Article Content: ${blogContent.length} characters`);
      console.log('Preview:', blogContent.substring(0, 500) + '...');
    } else {
      console.log('\n❌ Could not extract Blog Article section');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testClaudeFullContent();