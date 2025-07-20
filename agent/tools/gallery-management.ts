import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Gallery Management Tools for CRM Agent

// Create Gallery Tool
export const createGalleryTool = {
  name: 'create_gallery',
  description: 'Create a new client gallery for photo delivery and organization',
  parameters: z.object({
    title: z.string().describe('Gallery title (e.g., "Smith Family Session - December 2024")'),
    description: z.string().optional().describe('Gallery description or notes'),
    clientId: z.string().describe('Client ID this gallery belongs to'),
    isPublic: z.boolean().default(true).describe('Whether gallery is publicly viewable'),
    isPasswordProtected: z.boolean().default(false).describe('Whether gallery requires a password'),
    password: z.string().optional().describe('Password for protected galleries'),
    slug: z.string().optional().describe('URL slug (auto-generated if not provided)')
  }),
  execute: async (params: z.infer<typeof createGalleryTool.parameters>) => {
    try {
      // Generate slug if not provided
      const slug = params.slug || params.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
      
      const galleryQuery = `
        INSERT INTO galleries (title, description, client_id, is_public, is_password_protected, password, slug)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, slug, description, is_public, created_at
      `;
      
      const result = await sql(galleryQuery, [
        params.title,
        params.description || null,
        params.clientId,
        params.isPublic,
        params.isPasswordProtected,
        params.password || null,
        slug
      ]);
      
      return {
        success: true,
        gallery: result[0],
        message: `Gallery "${params.title}" has been created successfully and is ready for image uploads.`,
        next_steps: "You can now add images to this gallery or share the gallery URL with clients.",
        galleryUrl: `/galleries/${slug}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create gallery: ${error.message}`
      };
    }
  }
};

// Add Image to Gallery Tool
export const addImageToGalleryTool = {
  name: 'add_image_to_gallery',
  description: 'Add an image to an existing gallery',
  parameters: z.object({
    galleryId: z.string().describe('Gallery ID to add image to'),
    filename: z.string().describe('Image filename'),
    url: z.string().describe('Image URL or storage path'),
    title: z.string().optional().describe('Image title or caption'),
    description: z.string().optional().describe('Image description'),
    sortOrder: z.number().default(0).describe('Display order in gallery')
  }),
  execute: async (params: z.infer<typeof addImageToGalleryTool.parameters>) => {
    try {
      const imageQuery = `
        INSERT INTO gallery_images (gallery_id, filename, url, title, description, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, filename, url, title, created_at
      `;
      
      const result = await sql(imageQuery, [
        params.galleryId,
        params.filename,
        params.url,
        params.title || null,
        params.description || null,
        params.sortOrder
      ]);
      
      return {
        success: true,
        image: result[0],
        message: `Image "${params.filename}" added to gallery successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to add image to gallery: ${error.message}`
      };
    }
  }
};

// Read Galleries Tool
export const readGalleriesTool = {
  name: 'read_galleries',
  description: 'List galleries with optional filtering by client or status',
  parameters: z.object({
    clientId: z.string().optional().describe('Filter galleries by specific client ID'),
    isPublic: z.boolean().optional().describe('Filter by public/private status'),
    limit: z.number().default(20).describe('Maximum number of galleries to return'),
    includeImageCount: z.boolean().default(true).describe('Include image count for each gallery')
  }),
  execute: async (params: z.infer<typeof readGalleriesTool.parameters>) => {
    try {
      let query = `
        SELECT 
          g.id,
          g.title,
          g.slug,
          g.description,
          g.cover_image,
          g.is_public,
          g.is_password_protected,
          g.client_id,
          g.created_at,
          g.updated_at,
          c.first_name || ' ' || c.last_name as client_name,
          c.email as client_email
      `;
      
      if (params.includeImageCount) {
        query += `, COUNT(gi.id) as image_count`;
      }
      
      query += `
        FROM galleries g
        LEFT JOIN crm_clients c ON g.client_id = c.id
      `;
      
      if (params.includeImageCount) {
        query += ` LEFT JOIN gallery_images gi ON g.id = gi.gallery_id`;
      }
      
      const conditions = [];
      const values = [];
      let paramIndex = 1;
      
      if (params.clientId) {
        conditions.push(`g.client_id = $${paramIndex}`);
        values.push(params.clientId);
        paramIndex++;
      }
      
      if (params.isPublic !== undefined) {
        conditions.push(`g.is_public = $${paramIndex}`);
        values.push(params.isPublic);
        paramIndex++;
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      if (params.includeImageCount) {
        query += ` GROUP BY g.id, c.first_name, c.last_name, c.email`;
      }
      
      query += ` ORDER BY g.created_at DESC LIMIT $${paramIndex}`;
      values.push(params.limit);
      
      const galleries = await sql(query, values);
      
      return {
        success: true,
        galleries,
        count: galleries.length,
        message: `Successfully retrieved ${galleries.length} galleries with complete details.`,
        summary: galleries.length > 0 ? 
          `Latest gallery: "${galleries[0].title}" created ${new Date(galleries[0].created_at).toLocaleDateString()}` : 
          "No galleries found matching your criteria"
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to read galleries: ${error.message}`
      };
    }
  }
};

// Update Gallery Tool
export const updateGalleryTool = {
  name: 'update_gallery',
  description: 'Update gallery details like title, description, or privacy settings',
  parameters: z.object({
    galleryId: z.string().describe('Gallery ID to update'),
    title: z.string().optional().describe('New gallery title'),
    description: z.string().optional().describe('New gallery description'),
    isPublic: z.boolean().optional().describe('Update public/private status'),
    isPasswordProtected: z.boolean().optional().describe('Update password protection'),
    password: z.string().optional().describe('New password (if password protected)'),
    coverImage: z.string().optional().describe('Cover image URL')
  }),
  execute: async (params: z.infer<typeof updateGalleryTool.parameters>) => {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (params.title) {
        updates.push(`title = $${paramIndex}`);
        values.push(params.title);
        paramIndex++;
      }
      
      if (params.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(params.description);
        paramIndex++;
      }
      
      if (params.isPublic !== undefined) {
        updates.push(`is_public = $${paramIndex}`);
        values.push(params.isPublic);
        paramIndex++;
      }
      
      if (params.isPasswordProtected !== undefined) {
        updates.push(`is_password_protected = $${paramIndex}`);
        values.push(params.isPasswordProtected);
        paramIndex++;
      }
      
      if (params.password !== undefined) {
        updates.push(`password = $${paramIndex}`);
        values.push(params.password);
        paramIndex++;
      }
      
      if (params.coverImage !== undefined) {
        updates.push(`cover_image = $${paramIndex}`);
        values.push(params.coverImage);
        paramIndex++;
      }
      
      if (updates.length === 0) {
        return {
          success: false,
          error: "No updates provided"
        };
      }
      
      updates.push(`updated_at = NOW()`);
      
      const query = `
        UPDATE galleries 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, title, slug, description, is_public, updated_at
      `;
      values.push(params.galleryId);
      
      const result = await sql(query, values);
      
      if (result.length === 0) {
        return {
          success: false,
          error: "Gallery not found"
        };
      }
      
      return {
        success: true,
        gallery: result[0],
        message: "Gallery updated successfully"
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to update gallery: ${error.message}`
      };
    }
  }
};

// Delete Gallery Tool
export const deleteGalleryTool = {
  name: 'delete_gallery',
  description: 'Delete a gallery and all its images (use with caution)',
  parameters: z.object({
    galleryId: z.string().describe('Gallery ID to delete'),
    confirmDelete: z.boolean().describe('Confirmation that user wants to delete this gallery')
  }),
  execute: async (params: z.infer<typeof deleteGalleryTool.parameters>) => {
    try {
      if (!params.confirmDelete) {
        return {
          success: false,
          error: "Delete confirmation required. Set confirmDelete to true to proceed."
        };
      }
      
      // First get gallery info
      const galleryInfo = await sql(`SELECT title FROM galleries WHERE id = $1`, [params.galleryId]);
      
      if (galleryInfo.length === 0) {
        return {
          success: false,
          error: "Gallery not found"
        };
      }
      
      // Delete images first (cascade should handle this, but being explicit)
      await sql(`DELETE FROM gallery_images WHERE gallery_id = $1`, [params.galleryId]);
      
      // Delete gallery
      await sql(`DELETE FROM galleries WHERE id = $1`, [params.galleryId]);
      
      return {
        success: true,
        message: `Gallery "${galleryInfo[0].title}" and all its images deleted successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete gallery: ${error.message}`
      };
    }
  }
};

export const galleryTools = [
  createGalleryTool,
  addImageToGalleryTool,
  readGalleriesTool,
  updateGalleryTool,
  deleteGalleryTool
];