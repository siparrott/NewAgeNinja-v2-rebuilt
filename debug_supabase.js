import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtnwccyxwrevfnbkjvzm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bndjY3l4d3JldmZuYmtqdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgwMTgsImV4cCI6MjA2NTgyNDAxOH0.MiOeCq2NCD969D_SXQ1wAlheSvRY5h04cUnV0XNuOrc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPantlingGallery() {
  console.log('Creating Pantling Family gallery in Supabase...');
  
  // First, let's check what columns exist
  const { data: schemaInfo, error: schemaError } = await supabase
    .from('galleries')
    .select('*')
    .limit(0);
  
  console.log('Schema error (this is normal):', schemaError);
  
  // Create the gallery in Supabase to match the one in PostgreSQL
  const { data: gallery, error: galleryError } = await supabase
    .from('galleries')
    .insert({
      id: '28c6adeb-7ed8-43d1-b50e-8157c768ad49', // Match the PostgreSQL ID
      title: 'Pantling Family',
      slug: 'pantling-family',
      description: 'Beautiful family photography session',
      password: 'newagestudios'
    })
    .select()
    .single();
  
  if (galleryError) {
    console.error('Error creating gallery:', galleryError);
  } else {
    console.log('Gallery created successfully:', gallery);
  }
  
  // Also add some sample images for testing
  const sampleImages = [
    {
      gallery_id: '28c6adeb-7ed8-43d1-b50e-8157c768ad49',
      filename: 'landscape1.jpg',
      original_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      display_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
      thumb_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      order_index: 0,
      size_bytes: 2500000,
      content_type: 'image/jpeg',
      uploaded_at: new Date().toISOString()
    },
    {
      gallery_id: '28c6adeb-7ed8-43d1-b50e-8157c768ad49',
      filename: 'landscape2.jpg',
      original_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      display_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
      thumb_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      order_index: 1,
      size_bytes: 2300000,
      content_type: 'image/jpeg',
      uploaded_at: new Date().toISOString()
    },
    {
      gallery_id: '28c6adeb-7ed8-43d1-b50e-8157c768ad49',
      filename: 'landscape3.jpg',
      original_url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      display_url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
      thumb_url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      order_index: 2,
      size_bytes: 2800000,
      content_type: 'image/jpeg',
      uploaded_at: new Date().toISOString()
    },
    {
      gallery_id: '28c6adeb-7ed8-43d1-b50e-8157c768ad49',
      filename: 'city1.jpg',
      original_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      display_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
      thumb_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      order_index: 3,
      size_bytes: 2600000,
      content_type: 'image/jpeg',
      uploaded_at: new Date().toISOString()
    },
    {
      gallery_id: '28c6adeb-7ed8-43d1-b50e-8157c768ad49',
      filename: 'city2.jpg',
      original_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2156&q=80',
      display_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
      thumb_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      order_index: 4,
      size_bytes: 2400000,
      content_type: 'image/jpeg',
      uploaded_at: new Date().toISOString()
    }
  ];
  
  for (const imageData of sampleImages) {
    const { data: image, error: imageError } = await supabase
      .from('gallery_images')
      .insert(imageData)
      .select()
      .single();
    
    if (imageError) {
      console.error('Error creating image:', imageError);
    } else {
      console.log('Image created:', image.filename);
    }
  }
}

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

createPantlingGallery().then(() => {
  console.log('\n--- After creating gallery and images ---');
  return checkSupabaseData();
}).catch(console.error);