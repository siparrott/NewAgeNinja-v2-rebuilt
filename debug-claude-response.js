import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function debugClaudeResponse() {
  console.log('🔍 Testing what Claude actually returns with our current system prompt...\n');
  
  // Use the exact same prompt from our AutoBlog system
  const systemPrompt = `Du bist ein erfahrener Familienfotograf in Wien für New Age Fotografie.

AUFGABE: Schreibe einen VOLLSTÄNDIGEN deutschen Blog-Artikel über diese Fotosession.

WICHTIG: Schreibe den KOMPLETTEN Artikel in einer Antwort. Frage NICHT ob du fortfahren sollst!

KONTEXT: 
- Studio: New Age Fotografie, Wien
- Ton: Persönlich, authentisch, founder-led wie Sabri Suby
- Zielgruppe: Familien in Wien
- Preise: ab €149
- Website: Warteliste unter /warteliste/

FORMAT (VOLLSTÄNDIG AUSFÜLLEN):
**SEO Title:** [German SEO title with Vienna/photography keywords]
**Slug:** [url-friendly-slug]
**Headline (H1):** [Catchy German headline with emotional hook]
**Blog Article:**
[KOMPLETTER deutscher Blog-Artikel mit H1 und 6-8 H2-Abschnitten]
[Schreibe mindestens 1500 Wörter über diese Fotosession]
[Verwende persönlichen Wiener Ton und echte Details aus den Bildern]
[Preise €149+ erwähnen und /warteliste/ Link einbauen]
[Kundenstimmen und FAQ einbauen]
**Review Snippets:** [3 authentische Kundenbewertungen mit Namen]
**Meta Description:** [120-156 Zeichen German meta description]
**Excerpt:** [Kurzer deutscher Vorschautext]
**Tags:** [relevante deutsche Fotografie-Tags mit Komma getrennt]

Schreibe jetzt den VOLLSTÄNDIGEN Artikel ohne zu fragen ob du fortfahren sollst!`;
  
  try {
    // Send the same image that would be uploaded
    const testImagePath = 'attached_assets/image_1752810620486.png';
    let imageContent = null;
    
    if (fs.existsSync(testImagePath)) {
      const imageBuffer = fs.readFileSync(testImagePath);
      const base64Image = imageBuffer.toString('base64');
      imageContent = {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: base64Image
        }
      };
    }
    
    const messageContent = [
      {
        type: "text",
        text: systemPrompt
      }
    ];
    
    if (imageContent) {
      messageContent.push(imageContent);
      console.log('✅ Added test image to request');
    }
    
    console.log('Sending request to Claude...');
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ]
    });
    
    const content = response.content[0].text;
    console.log('\n' + '='.repeat(80));
    console.log('FULL CLAUDE RESPONSE:');
    console.log('='.repeat(80));
    console.log(content);
    console.log('='.repeat(80));
    console.log(`\nTOTAL LENGTH: ${content.length} characters`);
    
    // Test extraction patterns
    console.log('\n🔍 TESTING EXTRACTION PATTERNS:');
    
    const extractSection = (content, sectionHeader) => {
      const patterns = [
        new RegExp(`\\*\\*${sectionHeader}\\*\\*:?\\s*([^\\n\\*]+)`, 'i'),
        new RegExp(`\\*\\*${sectionHeader}\\*\\*:?\\s*([\\s\\S]*?)(?=\\n\\*\\*[^*]+\\*\\*|$)`, 'i'),
        new RegExp(`\\*\\*${sectionHeader}:\\*\\*\\s*([^\\n\\*]+)`, 'i')
      ];
      
      for (let i = 0; i < patterns.length; i++) {
        const regex = patterns[i];
        const match = content.match(regex);
        if (match && match[1] && match[1].trim()) {
          const extracted = match[1].trim();
          console.log(`- ${sectionHeader}: Pattern ${i + 1} matched → ${extracted.length} chars`);
          if (sectionHeader === 'Blog Article' && extracted.length > 100) {
            console.log(`  Preview: ${extracted.substring(0, 200)}...`);
          }
          return extracted;
        }
      }
      console.log(`- ${sectionHeader}: ❌ No pattern matched`);
      return null;
    };
    
    extractSection(content, 'SEO Title');
    extractSection(content, 'Slug');
    extractSection(content, 'Headline \\(H1\\)');
    extractSection(content, 'Blog Article');
    extractSection(content, 'Meta Description');
    extractSection(content, 'Excerpt');
    extractSection(content, 'Tags');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugClaudeResponse();