import { supabase } from './supabase';
import { 
  Gallery, 
  GalleryImage, 
  GalleryVisitor, 
  GalleryStats, 
  GalleryFormData,
  GalleryAuthData,
  GalleryAccessLog
} from '../types/gallery';

// Base URL for the galleries API
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/galleries`;

// Get all galleries (admin only)
export async function getGalleries(): Promise<Gallery[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDatabaseToGallery);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    throw error;
  }
}

// Get a single gallery by ID (admin only)
export async function getGalleryById(id: string): Promise<Gallery> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapDatabaseToGallery(data);
  } catch (error) {
    console.error(`Error fetching gallery with ID ${id}:`, error);
    throw error;
  }
}

// Get a single gallery by slug (public)
export async function getGalleryBySlug(slug: string): Promise<Gallery> {
  try {
    const response = await fetch(`${API_URL}/public/galleries/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch gallery');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching gallery with slug ${slug}:`, error);
    throw error;
  }
}

// Create a new gallery (admin only)
export async function createGallery(galleryData: GalleryFormData): Promise<Gallery> {
  try {
    console.log('createGallery called with:', galleryData);
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session user ID:', session?.user?.id);
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Generate slug from title
    const slug = galleryData.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 50); // Limit length

    console.log('Generated slug:', slug);

    // Handle cover image upload if provided
    let coverImageUrl = null;
    if (galleryData.coverImage) {
      try {
        const fileExt = galleryData.coverImage.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(`covers/${fileName}`, galleryData.coverImage);

        if (uploadError) {
          console.error('Cover image upload error:', uploadError);
        } else {
          const { data } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(uploadData.path);
          coverImageUrl = data.publicUrl;
        }
      } catch (uploadError) {
        console.error('Error uploading cover image:', uploadError);
      }
    }

    // Create the gallery with cover image
    const insertData = {
      title: galleryData.title,
      slug: slug,
      description: galleryData.description || null,
      cover_image: coverImageUrl,
      download_enabled: galleryData.downloadEnabled ?? true,
      client_id: session.user.id
    };
    
    console.log('Inserting data into galleries table:', insertData);
    
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .insert(insertData)
      .select()
      .single();

    console.log('Database response - data:', gallery, 'error:', galleryError);

    if (galleryError) {
      console.error('Gallery creation error details:', galleryError);
      throw galleryError;
    }

    // Create a gallery object that matches our interface
    const galleryResult: Gallery = {
      id: gallery.id,
      title: gallery.title,
      slug: gallery.slug || slug,
      coverImage: gallery.cover_image,
      passwordHash: gallery.password_hash,
      downloadEnabled: gallery.download_enabled,
      clientId: gallery.client_id,
      createdAt: gallery.created_at,
      updatedAt: gallery.updated_at || gallery.created_at
    };

    return galleryResult;
  } catch (error) {
    console.error('Error creating gallery:', error);
    throw error;
  }
}

// Update an existing gallery (admin only)
export async function updateGallery(id: string, galleryData: GalleryFormData): Promise<Gallery> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Prepare update data
    const updateData: any = {
      title: galleryData.title,
      download_enabled: galleryData.downloadEnabled,
      updated_at: new Date().toISOString()
    };

    // If password is provided and not empty, hash it
    if (galleryData.password) {
      updateData.password_hash = await hashPassword(galleryData.password);
    }

    // If there's a new cover image, upload it
    if (galleryData.coverImage) {
      updateData.cover_image = await uploadGalleryCoverImage(id, galleryData.coverImage);
    }

    // Update the gallery
    const { data, error } = await supabase
      .from('galleries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();    if (error) throw error;
    return mapDatabaseToGallery(data);
  } catch (error) {
    console.error(`Error updating gallery ${id}:`, error);
    throw error;
  }
}

// Delete a gallery (admin only)
export async function deleteGallery(id: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Delete the gallery (cascade will delete images, visitors, and actions)
    const { error } = await supabase
      .from('galleries')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Delete files from storage
    await supabase.storage
      .from('galleries')
      .remove([`${id}`]);
  } catch (error) {
    console.error(`Error deleting gallery ${id}:`, error);
    throw error;
  }
}

// Upload images to a gallery (admin only)
export async function uploadGalleryImages(galleryId: string, files: File[]): Promise<GalleryImage[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('galleryId', galleryId);
    
    // Append each file to the form data
    files.forEach(file => {
      formData.append('images', file);
    });

    // First try to use the Edge Function
    try {
      const response = await fetch(`${API_URL}/admin/galleries/${galleryId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload images');
      }

      return await response.json();
    } catch (edgeFunctionError) {
      console.warn('Edge Function upload failed, falling back to direct upload:', edgeFunctionError);
      
      // Fall back to direct upload if Edge Function fails
      const uploadedImages = [];
      
      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        // Upload original
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('galleries')
          .upload(`${galleryId}/original/${fileName}`, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl: originalUrl } } = supabase.storage
          .from('galleries')
          .getPublicUrl(`${galleryId}/original/${fileName}`);
        
        // For simplicity in the fallback, use the same URL for display and thumb
        // In a real implementation, you'd resize the images
        
        // Create database record
        const { data: image, error: imageError } = await supabase
          .from('gallery_images')
          .insert({
            gallery_id: galleryId,
            original_url: originalUrl,
            display_url: originalUrl, // In a real implementation, this would be a resized version
            thumb_url: originalUrl,   // In a real implementation, this would be a thumbnail
            filename: file.name,
            size_bytes: file.size,
            content_type: file.type,
            order_index: uploadedImages.length
          })
          .select()
          .single();
        
        if (imageError) throw imageError;
        
        uploadedImages.push(image);
        
        // If this is the first image, set it as the cover image if the gallery doesn't have one
        if (uploadedImages.length === 1) {
          const { data: gallery } = await supabase
            .from('galleries')
            .select('cover_image')
            .eq('id', galleryId)
            .single();
          
          if (!gallery.cover_image) {
            await supabase
              .from('galleries')
              .update({ cover_image: originalUrl })
              .eq('id', galleryId);
          }
        }
      }
      
      return uploadedImages;
    }
  } catch (error) {
    console.error('Error uploading gallery images:', error);
    throw error;
  }
}

// Get images for a gallery (admin only)
export async function getGalleryImages(galleryId: string): Promise<GalleryImage[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching images for gallery ${galleryId}:`, error);
    throw error;
  }
}

// Get gallery visitors (admin only)
export async function getGalleryVisitors(galleryId: string): Promise<GalleryVisitor[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('gallery_visitors')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching visitors for gallery ${galleryId}:`, error);
    throw error;
  }
}

// Get gallery access logs (admin only)
export async function getGalleryAccessLogs(galleryId: string): Promise<GalleryAccessLog[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('gallery_access_logs')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('accessed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching access logs for gallery ${galleryId}:`, error);
    throw error;
  }
}

// Update image order (admin only)
export async function updateImageOrder(galleryId: string, imageIds: string[]): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Update each image's order_index
    const updates = imageIds.map((id, index) => ({
      id,
      order_index: index
    }));

    const { error } = await supabase
      .from('gallery_images')
      .upsert(updates);

    if (error) throw error;
  } catch (error) {
    console.error(`Error updating image order for gallery ${galleryId}:`, error);
    throw error;
  }
}

// Delete an image (admin only)
export async function deleteGalleryImage(imageId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Get the image to find its URLs
    const { data: image, error: getError } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (getError) throw getError;

    // Delete the image record
    const { error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) throw deleteError;

    // Delete the image files from storage
    // This would need to extract the paths from the URLs
    const originalPath = new URL(image.original_url).pathname.split('/').pop();
    const displayPath = new URL(image.display_url).pathname.split('/').pop();
    const thumbPath = new URL(image.thumb_url).pathname.split('/').pop();

    await supabase.storage
      .from('galleries')
      .remove([
        `${image.gallery_id}/original/${originalPath}`,
        `${image.gallery_id}/display/${displayPath}`,
        `${image.gallery_id}/thumb/${thumbPath}`
      ]);
  } catch (error) {
    console.error(`Error deleting image ${imageId}:`, error);
    throw error;
  }
}

// Set gallery cover image (admin only)
export async function setGalleryCoverImage(galleryId: string, imageId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Get the image to find its thumb URL
    const { data: image, error: getError } = await supabase
      .from('gallery_images')
      .select('thumb_url')
      .eq('id', imageId)
      .single();

    if (getError) throw getError;

    // Update the gallery with the cover image URL
    const { error: updateError } = await supabase
      .from('galleries')
      .update({ cover_image: image.thumb_url })
      .eq('id', galleryId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error(`Error setting cover image for gallery ${galleryId}:`, error);
    throw error;
  }
}

// Get gallery stats (admin only)
export async function getGalleryStats(galleryId: string): Promise<GalleryStats> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/admin/analytics/galleries/${galleryId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch gallery stats');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching stats for gallery ${galleryId}:`, error);
    throw error;
  }
}

// PUBLIC GALLERY ACCESS FUNCTIONS

// Authenticate to a gallery (public)
export async function authenticateGallery(slug: string, authData: GalleryAuthData): Promise<{ token: string }> {
  try {
    const response = await fetch(`${API_URL}/public/galleries/${slug}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Authentication failed');
    }

    // Log access
    try {
      await supabase
        .from('gallery_access_logs')
        .insert({
          gallery_id: (await getGalleryBySlug(slug)).id,
          email: authData.email,
          first_name: authData.firstName || null,
          last_name: authData.lastName || null,
          ip_address: null, // Client-side can't reliably get IP
          user_agent: navigator.userAgent
        });
    } catch (logError) {
      console.error('Error logging gallery access:', logError);
      // Don't fail authentication if logging fails
    }

    return await response.json();
  } catch (error) {
    console.error(`Error authenticating to gallery ${slug}:`, error);
    throw error;
  }
}

// Get images for a public gallery (requires JWT)
export async function getPublicGalleryImages(slug: string, token: string): Promise<GalleryImage[]> {
  try {
    const response = await fetch(`${API_URL}/public/galleries/${slug}/images`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch gallery images');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching public images for gallery ${slug}:`, error);
    throw error;
  }
}

// Toggle favorite status for an image (requires JWT)
export async function toggleImageFavorite(imageId: string, token: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/public/images/${imageId}/favorite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle favorite status');
    }
  } catch (error) {
    console.error(`Error toggling favorite for image ${imageId}:`, error);
    throw error;
  }
}

// Download a gallery as ZIP (requires JWT)
export async function downloadGallery(slug: string, token: string): Promise<Blob> {
  try {
    const response = await fetch(`${API_URL}/public/galleries/${slug}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download gallery');
    }

    return await response.blob();
  } catch (error) {
    console.error(`Error downloading gallery ${slug}:`, error);
    throw error;
  }
}

// Get all public galleries (no authentication required)
export async function getPublicGalleries(limit?: number): Promise<Gallery[]> {
  try {
    let query = supabase
      .from('galleries')
      .select('id, title, slug, description, cover_image, created_at, client_email')
      .or('password_hash.is.null,password_hash.eq.\'\'')
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format for public consumption
    return (data || []).map(gallery => ({
      id: gallery.id,
      title: gallery.title,
      slug: gallery.slug,
      description: gallery.description,
      coverImage: gallery.cover_image,
      clientEmail: gallery.client_email,
      createdAt: gallery.created_at,
      updatedAt: gallery.created_at,
      isPasswordProtected: false, // Only public galleries are returned
      downloadEnabled: true, // Will be checked per gallery on access
      passwordHash: null,
      watermarkEnabled: false,
      maxDownloadsPerVisitor: undefined,
      expiresAt: null,
      clientId: null,
      isFeatured: false,
      sortOrder: 0
    }));
  } catch (error) {
    console.error('Error fetching public galleries:', error);
    throw error;
  }
}

// HELPER FUNCTIONS

// Hash a password
async function hashPassword(password: string): Promise<string> {
  // In a real implementation, this would use bcrypt
  // For now, we'll just use a simple hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Upload a cover image for a gallery
async function uploadGalleryCoverImage(galleryId: string, file: File): Promise<string> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `cover-${Date.now()}.${fileExt}`;
    const filePath = `${galleryId}/cover/${fileName}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('galleries')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('galleries')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading cover image:', error);
    throw error;
  }
}

// Helper function to map database schema (snake_case) to TypeScript interface (camelCase)
function mapDatabaseToGallery(dbGallery: any): Gallery {
  return {
    id: dbGallery.id,
    title: dbGallery.title,
    slug: dbGallery.slug || dbGallery.title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-'),
    coverImage: dbGallery.cover_image || null,
    passwordHash: dbGallery.password_hash || null,
    downloadEnabled: dbGallery.download_enabled ?? true,
    clientId: dbGallery.client_id || dbGallery.created_by, // Handle both old and new column names
    createdAt: dbGallery.created_at,
    updatedAt: dbGallery.updated_at || dbGallery.created_at
  };
}