import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function testClaudeSimple() {
  console.log('🔍 Testing Claude with simple prompt to see exact output format...\n');
  
  const simplePrompt = `Erstelle einen deutschen Blog-Artikel für New Age Fotografie Wien.

Format:
**SEO Title:** [Title]
**Slug:** [slug]
**Headline (H1):** [H1]
**Blog Article:** [Full article content with H2 sections]
**Meta Description:** [Description]
**Excerpt:** [Short excerpt]
**Tags:** [tags]

Schreibe über Familienfotografie in Wien auf Deutsch.`;
  
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: simplePrompt
        }
      ]
    });
    
    const content = response.content[0].text;
    console.log('✅ Claude Response:');
    console.log('='.repeat(80));
    console.log(content);
    console.log('='.repeat(80));
    console.log(`Length: ${content.length} characters`);
    
    // Test section extraction
    console.log('\n🔍 Testing section extraction:');
    
    const extractSection = (content, sectionHeader) => {
      const patterns = [
        new RegExp(`\\*\\*${sectionHeader}\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[^*]+\\*\\*|$)`, 'i'),
        new RegExp(`\\*\\*${sectionHeader}\\*\\*\\s*:?\\s*([\\s\\S]*?)(?=\\*\\*[^*]+:|$)`, 'i'),
        new RegExp(`${sectionHeader}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i')
      ];
      
      for (const regex of patterns) {
        const match = content.match(regex);
        if (match && match[1] && match[1].trim()) {
          return match[1].trim();
        }
      }
      
      return null;
    };
    
    const sections = ['SEO Title', 'Slug', 'Headline (H1)', 'Blog Article', 'Meta Description', 'Excerpt', 'Tags'];
    sections.forEach(section => {
      const extracted = extractSection(content, section);
      console.log(`${section}: ${extracted ? `${extracted.length} chars` : 'NOT FOUND'}`);
      if (extracted && section === 'Blog Article') {
        console.log(`Blog Article preview: ${extracted.substring(0, 200)}...`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testClaudeSimple();