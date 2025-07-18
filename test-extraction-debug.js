// Test extraction with real Claude response from your examples

const testContent = `**SEO Title:** Why Yellow Works Magic in Family Photos - New Age Fotografie Wien
**Slug:** yellow-family-photography-wien-tips
**Headline (H1):** The Secret Behind Those Jaw-Dropping Family Photos You See on Instagram

**Blog Article:**
Hey there! Matthew here from New Age Fotografie, and I've gotta tell you - after 12 years of photographing families in Vienna (and before that, South Africa and the UK), I still get that little buzz when a session comes together perfectly.

Like this gorgeous family session I'm sharing with you today. Look at those coordinated yellow outfits - absolutely stunning, right? But here's the thing most people don't realize: it's not just about the clothes.

## Why Yellow Works Magic (And It's Not What You Think)

Everyone asks me about color coordination. "Should we all wear the same thing?" "What if we look too matchy-matchy?"

Fair enough - it's a valid worry. But here's what I've learned from thousands of family sessions: yellow is basically photography gold. Not because it's trendy (though it definitely is right now), but because it does something magical to skin tones. It brings out warmth. It makes everyone look like they've just spent a perfect day in the sun.

This family? They nailed it. Different shades of yellow - from that soft butter yellow on the little one to the brighter sunshine yellow on mom. It creates layers, depth, but keeps everything harmonious. No fighting for attention, no one getting lost in the background.

## The Real Secret: Natural Light + Relaxed Vibes

But here's where the magic actually happens - and why I moved my studio to Vienna back in 2012. The light here is incredible. Soft, forgiving, perfect for families.

See how natural everyone looks in these photos? That's not accidental. That's what happens when you combine the right lighting with a photographer who knows how to make families feel at ease. No stiff poses, no forced smiles, no "say cheese" moments.

**Review Snippets:**
"Wonderful experience! The photos are amazing." - Family Mueller
"Finally family photos that look natural and not posed." - Sandra K.
"The best photo shoot we've ever had." - Family Berger

**Meta Description:**
Professional family photography in Vienna by New Age Fotografie. Authentic, relaxed sessions that capture genuine connections. Book your family portrait session today.`;

console.log('Testing extraction patterns with real Claude content...\n');

const blogPatterns = [
  // Pattern 1: **Blog Article:** followed by content (most common)
  /\*\*Blog Article:\*\*\s*\n*([\s\S]*?)(?=\n\*\*[A-Z][^*]*\*\*|$)/i,
  // Pattern 2: **Blog Article:** without newline
  /\*\*Blog Article:\*\*\s*([\s\S]*?)(?=\n\*\*[A-Z][^*]*\*\*|$)/i,
  // Pattern 3: Look for content between Blog Article and Review Snippets
  /\*\*Blog Article:\*\*\s*\n*([\s\S]*?)(?=\*\*Review Snippets\*\*|$)/i
];

for (let i = 0; i < blogPatterns.length; i++) {
  console.log(`Testing Pattern ${i + 1}:`, blogPatterns[i]);
  const match = testContent.match(blogPatterns[i]);
  if (match && match[1]) {
    const extracted = match[1].trim();
    console.log(`✅ Pattern ${i + 1} MATCHED: ${extracted.length} chars`);
    console.log('Preview:', extracted.substring(0, 200) + '...\n');
  } else {
    console.log(`❌ Pattern ${i + 1} failed\n`);
  }
}

// Test the specific pattern that should work
console.log('Testing most likely pattern...');
const specificPattern = /\*\*Blog Article:\*\*\s*([\s\S]*?)(?=\*\*Review Snippets\*\*)/i;
const specificMatch = testContent.match(specificPattern);
if (specificMatch) {
  console.log(`✅ Specific pattern matched: ${specificMatch[1].trim().length} chars`);
} else {
  console.log('❌ Specific pattern failed');
}