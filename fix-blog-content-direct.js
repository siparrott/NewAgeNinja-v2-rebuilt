/**
 * Direct fix for blog post malformed content
 */

import { db } from './server/db.js';
import { blogPosts } from './shared/schema.js';
import { eq } from 'drizzle-orm';

console.log('🔧 DIRECT FIX: Cleaning malformed blog post content...');

const CORRECT_CONTENT = `<h2>Vollständiger Artikel</h2>

<h3>Ein herzliches Willkommen in unserem Fotostudio</h3>

<p>Willkommen bei New Age Fotografie, dem charmantesten Fotostudio in ganz Wien! Unsere Adresse, Schönbrunner Str. 25, liegt nur einen Katzensprung von der Kettenbrückengasse entfernt. Vielleicht haben Sie uns schon einmal gesehen, als Sie durch die Stadt geschlendert sind. Hier legen wir großen Wert auf authentische, ungestellte Momente, die das wahre Leben Ihrer Familie einfangen. Unser Ziel? Dass Sie sich bei uns so wohl fühlen wie in Ihrem Wohnzimmer. Denn nur so entstehen diese besonderen, natürlichen Aufnahmen, die man ein Leben lang schätzt.</p>

<img src="https://9e3440b5-702f-48e8-b1e0-2463b6436d68-00-3ias8vrq97u7u.spock.replit.dev/blog-images/autoblog-1753105638893-1.jpg" alt="Professionelle Familienfotografie Session bei New Age Fotografie in Wien - Bild 1" style="width: 100%; height: auto; margin: 25px 0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">

<img src="https://9e3440b5-702f-48e8-b1e0-2463b6436d68-00-3ias8vrq97u7u.spock.replit.dev/blog-images/autoblog-1753105638974-2.jpg" alt="Professionelle Familienfotografie Session bei New Age Fotografie in Wien - Bild 2" style="width: 100%; height: auto; margin: 25px 0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">

<img src="https://9e3440b5-702f-48e8-b1e0-2463b6436d68-00-3ias8vrq97u7u.spock.replit.dev/blog-images/autoblog-1753105639057-3.jpg" alt="Professionelle Familienfotografie Session bei New Age Fotografie in Wien - Bild 3" style="width: 100%; height: auto; margin: 25px 0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">

<h3>Magie der Familienfotografie entdecken</h3>

<p>Warum ein professionelles Familienfotoshooting? Die Zeit vergeht schneller, als man denkt. Ein Lächeln, ein spontaner Blick, die kleinen Gesten zwischen Eltern und Kindern – all das sind Momente, die viel zu wertvoll sind, um sie einfach vorbeigehen zu lassen. Bei New Age Fotografie verstehen wir, dass jede Familie ihre ganz eigene Geschichte hat. Deshalb arbeiten wir auch nicht mit starren Posen oder künstlichen Arrangements. Stattdessen schaffen wir eine entspannte Atmosphäre, in der Sie und Ihre Lieben ganz Sie selbst sein können.</p>

<h2>Unser Ansatz bei der Familienfotografie</h2>

<p>In unserem Studio in Wien setzen wir auf natürliche Beleuchtung und eine warme, einladende Atmosphäre. Hier können sich auch die schüchternsten Familienmitglieder schnell entspannen. Ob Neugeborenenfotos, Familienporträts oder Schwangerschaftsaufnahmen – wir nehmen uns die Zeit, die es braucht, um die besonderen Verbindungen zwischen Ihnen einzufangen.</p>

<h2>Tipps für Ihre nächste Fotosession</h2>

<p>Planen Sie Ihre Fotosession am besten zu einer Zeit, wenn alle Familienmitglieder ausgeruht und gut gelaunt sind. Bringen Sie gerne mehrere Outfits mit – wir helfen Ihnen bei der Auswahl der besten Kombinationen. Und keine Sorge wegen der Kinder: Wir haben viel Geduld und einige Tricks, um auch die Kleinsten zum Lächeln zu bringen!</p>

<h2>Die Bedeutung authentischer Momente</h2>

<p>Was macht ein Familienfoto wirklich besonders? Es sind nicht die perfekten Posen oder das makellose Make-up – es sind die echten, ungefilterten Augenblicke der Verbundenheit. Ein verschmitztes Lächeln, ein liebevoller Blick zwischen den Eltern, das ausgelassene Lachen der Kinder – diese Momente können nicht inszeniert werden, sie müssen entstehen.</p>

<h2>Warum New Age Fotografie wählen</h2>

<p>Bei uns steht Ihre Familie im Mittelpunkt. Wir nehmen uns die Zeit, Sie kennenzulernen und eine Verbindung aufzubauen, bevor wir überhaupt zur Kamera greifen. Unser Studio bietet eine entspannte, familienfreundliche Umgebung, und unser Ansatz ist flexibel genug, um sich an die Bedürfnisse jeder Familie anzupassen.</p>

<h2>Kontakt und Buchung</h2>

<p>Bereit für Ihre Familienfotosession? Kontaktieren Sie uns unter +43 677 933 99210 oder per E-Mail an hallo@newagefotografie.com. Wir freuen uns darauf, Ihre besonderen Momente festzuhalten und Ihnen Erinnerungen zu schaffen, die ein Leben lang halten.</p>`;

async function fixBlogContent() {
  try {
    // Update the specific blog post with correct content
    const result = await db
      .update(blogPosts)
      .set({
        content: CORRECT_CONTENT,
        contentHtml: CORRECT_CONTENT,
        excerpt: "Willkommen bei New Age Fotografie, dem charmantesten Fotostudio in ganz Wien! Hier legen wir großen Wert auf authentische, ungestellte Momente..."
      })
      .where(eq(blogPosts.id, 'a15653f3-b42b-4378-b841-8edc95897e44'));

    console.log('✅ SUCCESS: Blog post content fixed!');
    console.log('📊 Content now has proper structure:');
    console.log(`- Length: ${CORRECT_CONTENT.length} characters`);
    console.log(`- H2 headings: ${(CORRECT_CONTENT.match(/<h2>/g) || []).length}`);
    console.log(`- H3 headings: ${(CORRECT_CONTENT.match(/<h3>/g) || []).length}`);
    console.log(`- Paragraphs: ${(CORRECT_CONTENT.match(/<p>/g) || []).length}`);
    console.log(`- Images: ${(CORRECT_CONTENT.match(/<img/g) || []).length}`);
    
    // Verify the fix
    const updatedPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, 'a15653f3-b42b-4378-b841-8edc95897e44')
    });
    
    if (updatedPost && !updatedPost.content.includes('---</p>')) {
      console.log('🎉 VERIFICATION: Malformed HTML completely removed!');
      console.log('🎨 Blog post now displays with proper formatting structure');
    } else {
      console.log('⚠️ WARNING: Content may still need additional fixes');
    }
    
  } catch (error) {
    console.error('❌ Error fixing blog content:', error);
  }
}

// Run the fix
fixBlogContent();