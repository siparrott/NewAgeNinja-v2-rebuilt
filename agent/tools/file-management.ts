import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// File Management Tools for CRM Agent - Feature 6

// Upload File Tool
export const uploadFileTool = {
  name: "upload_file",
  description: "Upload and organize files in the digital files system",
  parameters: z.object({
    folder_name: z.string().min(1, "Folder name required"),
    file_name: z.string().min(1, "File name required"),
    file_type: z.enum(["image", "document", "video", "audio", "other"]),
    file_size: z.number().min(1),
    client_id: z.string().uuid().optional(),
    session_id: z.string().uuid().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().default(false)
  }),
  execute: async (params: any) => {
    try {
      const fileId = crypto.randomUUID();
      
      await sql`
        INSERT INTO digital_files (
          id, folder_name, file_name, file_type, file_size,
          client_id, session_id, description, tags, is_public,
          uploaded_at, created_at, updated_at
        ) VALUES (
          ${fileId}, ${params.folder_name}, ${params.file_name}, 
          ${params.file_type}, ${params.file_size}, ${params.client_id || null},
          ${params.session_id || null}, ${params.description || ''}, 
          ${JSON.stringify(params.tags || [])}, ${params.is_public},
          NOW(), NOW(), NOW()
        )
      `;

      return {
        success: true,
        file_id: fileId,
        message: `File uploaded successfully to folder: ${params.folder_name}`,
        details: {
          folder: params.folder_name,
          file_name: params.file_name,
          type: params.file_type,
          size: `${(params.file_size / 1024 / 1024).toFixed(2)} MB`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Files Tool
export const readFilesTool = {
  name: "read_digital_files",
  description: "Retrieve digital files with filtering and search options",
  parameters: z.object({
    folder_name: z.string().optional(),
    file_type: z.enum(["image", "document", "video", "audio", "other"]).optional(),
    client_id: z.string().uuid().optional(),
    session_id: z.string().uuid().optional(),
    search_term: z.string().optional(),
    is_public: z.boolean().optional(),
    limit: z.number().min(1).max(100).default(20)
  }),
  execute: async (params: any) => {
    try {
      let query = `
        SELECT 
          df.id,
          df.folder_name,
          df.file_name,
          df.file_type,
          df.file_size,
          df.description,
          df.tags,
          df.is_public,
          df.uploaded_at,
          c.first_name || ' ' || c.last_name as client_name,
          ps.session_type
        FROM digital_files df
        LEFT JOIN crm_clients c ON df.client_id = c.id::text
        LEFT JOIN photography_sessions ps ON df.session_id = ps.id::text
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (params.folder_name) {
        conditions.push(`df.folder_name ILIKE $${paramIndex}`);
        values.push(`%${params.folder_name}%`);
        paramIndex++;
      }
      
      if (params.file_type) {
        conditions.push(`df.file_type = $${paramIndex}`);
        values.push(params.file_type);
        paramIndex++;
      }
      
      if (params.client_id) {
        conditions.push(`df.client_id = $${paramIndex}`);
        values.push(params.client_id);
        paramIndex++;
      }
      
      if (params.session_id) {
        conditions.push(`df.session_id = $${paramIndex}`);
        values.push(params.session_id);
        paramIndex++;
      }
      
      if (params.search_term) {
        conditions.push(`(df.file_name ILIKE $${paramIndex} OR df.description ILIKE $${paramIndex})`);
        values.push(`%${params.search_term}%`);
        paramIndex++;
      }
      
      if (params.is_public !== undefined) {
        conditions.push(`df.is_public = $${paramIndex}`);
        values.push(params.is_public);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY df.uploaded_at DESC LIMIT $${paramIndex}`;
      values.push(params.limit);

      const files = await sql(query, values);

      return {
        success: true,
        count: files.length,
        files: files.map(file => ({
          id: file.id,
          folder_name: file.folder_name,
          file_name: file.file_name,
          file_type: file.file_type,
          file_size: `${(file.file_size / 1024 / 1024).toFixed(2)} MB`,
          client_name: file.client_name || 'No client',
          session_type: file.session_type || 'No session',
          description: file.description || 'No description',
          tags: Array.isArray(file.tags) ? file.tags : JSON.parse(file.tags || '[]'),
          is_public: file.is_public,
          uploaded_at: file.uploaded_at
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read files: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Update File Tool
export const updateFileTool = {
  name: "update_digital_file",
  description: "Update file metadata, move between folders, or change organization",
  parameters: z.object({
    file_id: z.string().uuid("Valid file UUID required"),
    folder_name: z.string().optional(),
    file_name: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().optional(),
    client_id: z.string().uuid().optional(),
    session_id: z.string().uuid().optional()
  }),
  execute: async (params: any) => {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(params).forEach(key => {
        if (key !== 'file_id' && params[key] !== undefined) {
          if (key === 'tags') {
            updates.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(params[key]));
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
      values.push(params.file_id);

      const query = `
        UPDATE digital_files 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, folder_name, file_name, file_type, updated_at
      `;

      const result = await sql(query, values);

      if (result.length === 0) {
        return { success: false, error: "File not found" };
      }

      return {
        success: true,
        message: "File updated successfully",
        file: {
          id: result[0].id,
          folder_name: result[0].folder_name,
          file_name: result[0].file_name,
          file_type: result[0].file_type,
          updated_at: result[0].updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Delete File Tool
export const deleteFileTool = {
  name: "delete_digital_file",
  description: "Delete a file from the digital files system",
  parameters: z.object({
    file_id: z.string().uuid("Valid file UUID required"),
    reason: z.string().min(1, "Deletion reason required"),
    permanent: z.boolean().default(false)
  }),
  execute: async (params: any) => {
    try {
      const result = await sql`
        DELETE FROM digital_files 
        WHERE id = ${params.file_id}
        RETURNING id, folder_name, file_name, file_type
      `;

      if (result.length === 0) {
        return { success: false, error: "File not found" };
      }

      return {
        success: true,
        message: "File deleted successfully",
        deleted_file: {
          id: result[0].id,
          folder_name: result[0].folder_name,
          file_name: result[0].file_name,
          file_type: result[0].file_type
        },
        reason: params.reason,
        permanent: params.permanent
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Organize Files by Folder Tool
export const organizeFilesTool = {
  name: "organize_files_by_folder",
  description: "Get folder organization and file statistics",
  parameters: z.object({
    folder_name: z.string().optional(),
    include_stats: z.boolean().default(true),
    include_recent: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      let folderQuery = `
        SELECT 
          folder_name,
          COUNT(*) as file_count,
          SUM(file_size) as total_size,
          COUNT(CASE WHEN file_type = 'image' THEN 1 END) as image_count,
          COUNT(CASE WHEN file_type = 'document' THEN 1 END) as document_count,
          COUNT(CASE WHEN file_type = 'video' THEN 1 END) as video_count,
          MAX(uploaded_at) as last_uploaded
        FROM digital_files
      `;

      if (params.folder_name) {
        folderQuery += ` WHERE folder_name = '${params.folder_name}'`;
      }

      folderQuery += ` GROUP BY folder_name ORDER BY file_count DESC`;

      const folders = await sql(folderQuery);

      const result: any = {
        success: true,
        total_folders: folders.length,
        folders: folders.map(folder => ({
          name: folder.folder_name,
          file_count: folder.file_count,
          total_size: `${(folder.total_size / 1024 / 1024).toFixed(2)} MB`,
          breakdown: {
            images: folder.image_count,
            documents: folder.document_count,
            videos: folder.video_count
          },
          last_uploaded: folder.last_uploaded
        }))
      };

      if (params.include_recent) {
        const recentFiles = await sql`
          SELECT folder_name, file_name, file_type, uploaded_at
          FROM digital_files
          ORDER BY uploaded_at DESC
          LIMIT 10
        `;

        result.recent_files = recentFiles.map(file => ({
          folder: file.folder_name,
          name: file.file_name,
          type: file.file_type,
          uploaded: file.uploaded_at
        }));
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to organize files: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const fileManagementTools = [
  uploadFileTool,
  readFilesTool,
  updateFileTool,
  deleteFileTool,
  organizeFilesTool
];