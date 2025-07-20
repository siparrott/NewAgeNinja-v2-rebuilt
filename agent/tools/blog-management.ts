import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Blog Management Tools for CRM Agent - Feature 7

// Create Blog Post Tool
export const createBlogPostTool = {
  name: "create_blog_post",
  description: "Create a new blog post for the photography website",
  parameters: z.object({
    title: z.string().min(1, "Blog title required"),
    slug: z.string().min(1, "URL slug required"),
    content: z.string().min(100, "Blog content must be at least 100 characters"),
    excerpt: z.string().optional(),
    image_url: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"),
    scheduled_for: z.string().optional(),
    featured: z.boolean().default(false),
    category: z.string().optional()
  }),
  execute: async (params: any) => {
    try {
      const postId = crypto.randomUUID();
      
      await sql`
        INSERT INTO blog_posts (
          id, title, slug, content, excerpt, image_url, tags,
          meta_title, meta_description, status, scheduled_for,
          featured, category, created_at, updated_at
        ) VALUES (
          ${postId}, ${params.title}, ${params.slug}, ${params.content},
          ${params.excerpt || ''}, ${params.image_url || null}, 
          ${JSON.stringify(params.tags || [])}, ${params.meta_title || params.title},
          ${params.meta_description || params.excerpt || ''}, ${params.status},
          ${params.scheduled_for ? new Date(params.scheduled_for) : null},
          ${params.featured}, ${params.category || 'Photography'}, 
          NOW(), NOW()
        )
      `;

      return {
        success: true,
        post_id: postId,
        message: `Blog post "${params.title}" created successfully`,
        details: {
          title: params.title,
          slug: params.slug,
          status: params.status,
          featured: params.featured,
          scheduled_for: params.scheduled_for || 'Not scheduled'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Blog Posts Tool
export const readBlogPostsTool = {
  name: "read_blog_posts",
  description: "Retrieve blog posts with filtering and search options",
  parameters: z.object({
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(),
    featured: z.boolean().optional(),
    category: z.string().optional(),
    search_term: z.string().optional(),
    tags: z.array(z.string()).optional(),
    limit: z.number().min(1).max(50).default(10),
    include_stats: z.boolean().default(false)
  }),
  execute: async (params: any) => {
    try {
      let query = `
        SELECT 
          id, title, slug, content, excerpt, image_url, tags,
          meta_title, meta_description, status, scheduled_for,
          featured, category, created_at, updated_at,
          CHAR_LENGTH(content) as content_length
        FROM blog_posts
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (params.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(params.status);
        paramIndex++;
      }
      
      if (params.featured !== undefined) {
        conditions.push(`featured = $${paramIndex}`);
        values.push(params.featured);
        paramIndex++;
      }
      
      if (params.category) {
        conditions.push(`category ILIKE $${paramIndex}`);
        values.push(`%${params.category}%`);
        paramIndex++;
      }
      
      if (params.search_term) {
        conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex})`);
        values.push(`%${params.search_term}%`);
        paramIndex++;
      }
      
      if (params.tags && params.tags.length > 0) {
        const tagConditions = params.tags.map((_, index) => `tags::text ILIKE $${paramIndex + index}`);
        conditions.push(`(${tagConditions.join(' OR ')})`);
        params.tags.forEach(tag => values.push(`%"${tag}"%`));
        paramIndex += params.tags.length;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      values.push(params.limit);

      const posts = await sql(query, values);

      const result: any = {
        success: true,
        count: posts.length,
        posts: posts.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || post.content.substring(0, 200) + '...',
          image_url: post.image_url,
          tags: Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags || '[]'),
          status: post.status,
          scheduled_for: post.scheduled_for,
          featured: post.featured,
          category: post.category,
          content_length: `${post.content_length} characters`,
          created_at: post.created_at,
          updated_at: post.updated_at
        }))
      };

      if (params.include_stats) {
        const stats = await sql`
          SELECT 
            COUNT(*) as total_posts,
            COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_count,
            COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
            COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled_count,
            COUNT(CASE WHEN featured = true THEN 1 END) as featured_count
          FROM blog_posts
        `;

        result.stats = {
          total_posts: stats[0].total_posts,
          published: stats[0].published_count,
          drafts: stats[0].draft_count,
          scheduled: stats[0].scheduled_count,
          featured: stats[0].featured_count
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to read blog posts: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Update Blog Post Tool
export const updateBlogPostTool = {
  name: "update_blog_post",
  description: "Update an existing blog post (content, status, metadata)",
  parameters: z.object({
    post_id: z.string().uuid("Valid blog post UUID required"),
    title: z.string().optional(),
    slug: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    image_url: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(),
    scheduled_for: z.string().optional(),
    featured: z.boolean().optional(),
    category: z.string().optional()
  }),
  execute: async (params: any) => {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(params).forEach(key => {
        if (key !== 'post_id' && params[key] !== undefined) {
          if (key === 'tags') {
            updates.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(params[key]));
          } else if (key === 'scheduled_for' && params[key]) {
            updates.push(`${key} = $${paramIndex}`);
            values.push(new Date(params[key]));
          } else {
            updates.push(`${key} = $${paramIndex}`);
            values.push(params[key]);
          }
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        return { success: false, error: "No updates provided" };
      }

      updates.push('updated_at = NOW()');
      values.push(params.post_id);

      const query = `
        UPDATE blog_posts 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, title, slug, status, featured, updated_at
      `;

      const result = await sql(query, values);

      if (result.length === 0) {
        return { success: false, error: "Blog post not found" };
      }

      return {
        success: true,
        message: "Blog post updated successfully",
        post: {
          id: result[0].id,
          title: result[0].title,
          slug: result[0].slug,
          status: result[0].status,
          featured: result[0].featured,
          updated_at: result[0].updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Delete Blog Post Tool
export const deleteBlogPostTool = {
  name: "delete_blog_post",
  description: "Delete a blog post from the website",
  parameters: z.object({
    post_id: z.string().uuid("Valid blog post UUID required"),
    reason: z.string().min(1, "Deletion reason required"),
    permanent: z.boolean().default(false)
  }),
  execute: async (params: any) => {
    try {
      const result = await sql`
        DELETE FROM blog_posts 
        WHERE id = ${params.post_id}
        RETURNING id, title, slug, status
      `;

      if (result.length === 0) {
        return { success: false, error: "Blog post not found" };
      }

      return {
        success: true,
        message: "Blog post deleted successfully",
        deleted_post: {
          id: result[0].id,
          title: result[0].title,
          slug: result[0].slug,
          status: result[0].status
        },
        reason: params.reason,
        permanent: params.permanent
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Publish Blog Post Tool
export const publishBlogPostTool = {
  name: "publish_blog_post",
  description: "Publish a draft blog post or schedule it for future publication",
  parameters: z.object({
    post_id: z.string().uuid("Valid blog post UUID required"),
    action: z.enum(["publish_now", "schedule", "unpublish"]),
    scheduled_for: z.string().optional(),
    featured: z.boolean().optional()
  }),
  execute: async (params: any) => {
    try {
      let status = 'DRAFT';
      let scheduledFor = null;

      switch (params.action) {
        case 'publish_now':
          status = 'PUBLISHED';
          break;
        case 'schedule':
          if (!params.scheduled_for) {
            return { success: false, error: "Scheduled time required for scheduling" };
          }
          status = 'SCHEDULED';
          scheduledFor = new Date(params.scheduled_for);
          break;
        case 'unpublish':
          status = 'DRAFT';
          break;
      }

      const updates = [`status = '${status}'`, 'updated_at = NOW()'];
      const values = [];
      let paramIndex = 1;

      if (scheduledFor) {
        updates.push(`scheduled_for = $${paramIndex}`);
        values.push(scheduledFor);
        paramIndex++;
      }

      if (params.featured !== undefined) {
        updates.push(`featured = $${paramIndex}`);
        values.push(params.featured);
        paramIndex++;
      }

      values.push(params.post_id);

      const query = `
        UPDATE blog_posts 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, title, slug, status, featured, scheduled_for
      `;

      const result = await sql(query, values);

      if (result.length === 0) {
        return { success: false, error: "Blog post not found" };
      }

      return {
        success: true,
        message: `Blog post ${params.action.replace('_', ' ')} successfully`,
        post: {
          id: result[0].id,
          title: result[0].title,
          slug: result[0].slug,
          status: result[0].status,
          featured: result[0].featured,
          scheduled_for: result[0].scheduled_for
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to ${params.action.replace('_', ' ')} blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const blogManagementTools = [
  createBlogPostTool,
  readBlogPostsTool,
  updateBlogPostTool,
  deleteBlogPostTool,
  publishBlogPostTool
];