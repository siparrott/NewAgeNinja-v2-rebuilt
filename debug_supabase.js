const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtnwccyxwrevfnbkjvzm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bndjY3l4d3JldmZuYmtqdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgwMTgsImV4cCI6MjA2NTgyNDAxOH0.MiOeCq2NCD969D_SXQ1wAlheSvRY5h04cUnV0XNuOrc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseData() {
  console.log('Checking Supabase gallery_images table...');
  
  // Get all gallery images
  const { data: allImages, error: allError } = await supabase
    .from('gallery_images')
    .select('*');
  
  if (allError) {
    console.error('Error fetching all images:', allError);
  } else {
    console.log('Total images in gallery_images table:', allImages.length);
    allImages.forEach((img, i) => {
      console.log(`Image ${i + 1}:`, {
        id: img.id,
        gallery_id: img.gallery_id,
        filename: img.filename,
        original_url: img.original_url ? img.original_url.substring(0, 50) + '...' : 'null'
      });
    });
  }
  
  // Check galleries table
  const { data: galleries, error: galleriesError } = await supabase
    .from('galleries')
    .select('*');
  
  if (galleriesError) {
    console.error('Error fetching galleries:', galleriesError);
  } else {
    console.log('\nGalleries in Supabase:');
    galleries.forEach((gallery, i) => {
      console.log(`Gallery ${i + 1}:`, {
        id: gallery.id,
        slug: gallery.slug,
        title: gallery.title
      });
    });
  }
}

checkSupabaseData().catch(console.error);