import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Customer Portal Management Tools for CRM Agent - Feature 14

// Create Portal Access Tool
export const createPortalAccessTool = {
  name: "create_portal_access",
  description: "Grant clients access to their customer portal with personalized dashboard",
  parameters: z.object({
    client_id: z.string().uuid("Valid client ID required"),
    access_level: z.enum(["basic", "premium", "full"]).default("basic"),
    features: z.array(z.enum(["galleries", "invoices", "bookings", "files", "communication"])).default(["galleries", "invoices"]),
    portal_settings: z.object({
      auto_login: z.boolean().default(false),
      email_notifications: z.boolean().default(true),
      mobile_access: z.boolean().default(true),
      custom_branding: z.boolean().default(false)
    }).optional()
  }),
  execute: async (params: any) => {
    try {
      // Check if client exists
      const client = await sql`
        SELECT id, first_name, last_name, email
        FROM crm_clients
        WHERE id = ${params.client_id}
      `;

      if (client.length === 0) {
        return { success: false, error: "Client not found" };
      }

      const clientData = client[0];
      const portalId = crypto.randomUUID();
      const accessToken = crypto.randomUUID();

      // Create portal access record
      await sql`
        INSERT INTO client_portal_access (
          id, client_id, access_level, features, portal_settings,
          access_token, active, created_at, updated_at
        ) VALUES (
          ${portalId}, ${params.client_id}, ${params.access_level},
          ${JSON.stringify(params.features)}, ${JSON.stringify(params.portal_settings || {})},
          ${accessToken}, true, NOW(), NOW()
        )
        ON CONFLICT (client_id) 
        DO UPDATE SET 
          access_level = ${params.access_level},
          features = ${JSON.stringify(params.features)},
          portal_settings = ${JSON.stringify(params.portal_settings || {})},
          updated_at = NOW()
      `;

      return {
        success: true,
        message: `Portal access created for ${clientData.first_name} ${clientData.last_name}`,
        portal: {
          id: portalId,
          client: {
            id: clientData.id,
            name: `${clientData.first_name} ${clientData.last_name}`,
            email: clientData.email
          },
          access_level: params.access_level,
          features: params.features,
          portal_url: `/portal/${accessToken}`,
          created_at: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create portal access: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Manage Portal Content Tool
export const managePortalContentTool = {
  name: "manage_portal_content",
  description: "Manage client-specific portal content including galleries, documents, and messages",
  parameters: z.object({
    action: z.enum(["add_content", "remove_content", "update_content", "list_content"]),
    client_id: z.string().uuid("Valid client ID required"),
    content_type: z.enum(["gallery", "document", "message", "invoice", "session"]).optional(),
    content_data: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      file_path: z.string().optional(),
      gallery_id: z.string().optional(),
      message_text: z.string().optional(),
      visibility: z.enum(["public", "private", "shared"]).default("private")
    }).optional(),
    content_id: z.string().uuid().optional()
  }),
  execute: async (params: any) => {
    try {
      switch (params.action) {
        case 'add_content':
          if (!params.content_type || !params.content_data) {
            return { success: false, error: "Content type and data required" };
          }

          const contentId = crypto.randomUUID();

          await sql`
            INSERT INTO client_portal_content (
              id, client_id, content_type, title, description,
              file_path, gallery_id, message_text, visibility,
              created_at, updated_at
            ) VALUES (
              ${contentId}, ${params.client_id}, ${params.content_type},
              ${params.content_data.title || ''}, ${params.content_data.description || ''},
              ${params.content_data.file_path || null}, ${params.content_data.gallery_id || null},
              ${params.content_data.message_text || null}, ${params.content_data.visibility},
              NOW(), NOW()
            )
          `;

          return {
            success: true,
            message: `${params.content_type} content added to client portal`,
            content: {
              id: contentId,
              type: params.content_type,
              title: params.content_data.title,
              visibility: params.content_data.visibility
            }
          };

        case 'list_content':
          let contentQuery = `
            SELECT 
              id, content_type, title, description, file_path,
              gallery_id, message_text, visibility, created_at
            FROM client_portal_content
            WHERE client_id = $1
          `;
          const queryParams = [params.client_id];

          if (params.content_type) {
            contentQuery += ' AND content_type = $2';
            queryParams.push(params.content_type);
          }

          contentQuery += ' ORDER BY created_at DESC';

          const content = await sql(contentQuery, queryParams);

          return {
            success: true,
            count: content.length,
            content: content.map(item => ({
              id: item.id,
              type: item.content_type,
              title: item.title,
              description: item.description,
              file_path: item.file_path,
              gallery_id: item.gallery_id,
              message_text: item.message_text,
              visibility: item.visibility,
              created_at: item.created_at
            }))
          };

        case 'update_content':
          if (!params.content_id || !params.content_data) {
            return { success: false, error: "Content ID and update data required" };
          }

          const updates = [];
          const values = [];
          let paramIndex = 1;

          Object.keys(params.content_data).forEach(key => {
            if (params.content_data[key] !== undefined) {
              updates.push(`${key} = $${paramIndex}`);
              values.push(params.content_data[key]);
              paramIndex++;
            }
          });

          if (updates.length === 0) {
            return { success: false, error: "No updates provided" };
          }

          updates.push('updated_at = NOW()');
          values.push(params.content_id);

          const updateQuery = `
            UPDATE client_portal_content 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, content_type, title, updated_at
          `;

          const result = await sql(updateQuery, values);

          if (result.length === 0) {
            return { success: false, error: "Content not found" };
          }

          return {
            success: true,
            message: "Portal content updated successfully",
            content: result[0]
          };

        case 'remove_content':
          if (!params.content_id) {
            return { success: false, error: "Content ID required for removal" };
          }

          await sql`
            DELETE FROM client_portal_content 
            WHERE id = ${params.content_id} AND client_id = ${params.client_id}
          `;

          return {
            success: true,
            message: "Portal content removed successfully"
          };

        default:
          return { success: false, error: "Invalid action specified" };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to manage portal content: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Portal Analytics Tool
export const readPortalAnalyticsTool = {
  name: "read_portal_analytics",
  description: "Get analytics on client portal usage, engagement, and activity",
  parameters: z.object({
    analytics_type: z.enum(["usage", "engagement", "popular_content", "client_activity"]),
    time_range: z.enum(["day", "week", "month", "quarter"]).default("month"),
    client_id: z.string().uuid().optional()
  }),
  execute: async (params: any) => {
    try {
      const analytics: any = {
        success: true,
        analytics_type: params.analytics_type,
        time_range: params.time_range,
        timestamp: new Date().toISOString()
      };

      let dateFilter: Date;
      switch (params.time_range) {
        case 'day':
          dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default: // month
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      switch (params.analytics_type) {
        case 'usage':
          const usageStats = await sql`
            SELECT 
              COUNT(DISTINCT client_id) as active_clients,
              COUNT(*) as total_sessions,
              AVG(session_duration) as avg_session_duration
            FROM client_portal_sessions
            WHERE created_at >= ${dateFilter}
          `;

          const portalAccess = await sql`
            SELECT 
              COUNT(*) as total_portals,
              COUNT(CASE WHEN active = true THEN 1 END) as active_portals,
              access_level,
              COUNT(*) as level_count
            FROM client_portal_access
            GROUP BY access_level
          `;

          analytics.usage = {
            active_clients: usageStats[0]?.active_clients || 0,
            total_sessions: usageStats[0]?.total_sessions || 0,
            avg_session_duration: usageStats[0]?.avg_session_duration || 0,
            total_portals: portalAccess[0]?.total_portals || 0,
            active_portals: portalAccess[0]?.active_portals || 0,
            access_levels: portalAccess.map(level => ({
              level: level.access_level,
              count: level.level_count
            }))
          };
          break;

        case 'engagement':
          const engagementData = await sql`
            SELECT 
              content_type,
              COUNT(*) as view_count,
              AVG(time_spent) as avg_time_spent
            FROM client_portal_activity
            WHERE created_at >= ${dateFilter}
            GROUP BY content_type
            ORDER BY view_count DESC
          `;

          analytics.engagement = {
            content_interactions: engagementData.map(data => ({
              content_type: data.content_type,
              views: data.view_count,
              avg_time_spent: `${Math.round(data.avg_time_spent || 0)} seconds`
            })),
            total_interactions: engagementData.reduce((sum, data) => sum + data.view_count, 0)
          };
          break;

        case 'popular_content':
          const popularContent = await sql`
            SELECT 
              pc.id, pc.title, pc.content_type, pc.client_id,
              COUNT(pa.id) as view_count,
              c.first_name || ' ' || c.last_name as client_name
            FROM client_portal_content pc
            LEFT JOIN client_portal_activity pa ON pc.id = pa.content_id
            LEFT JOIN crm_clients c ON pc.client_id = c.id
            WHERE pa.created_at >= ${dateFilter} OR pa.created_at IS NULL
            GROUP BY pc.id, pc.title, pc.content_type, pc.client_id, c.first_name, c.last_name
            ORDER BY view_count DESC
            LIMIT 10
          `;

          analytics.popular_content = popularContent.map(content => ({
            id: content.id,
            title: content.title,
            type: content.content_type,
            client_name: content.client_name,
            views: content.view_count || 0
          }));
          break;

        case 'client_activity':
          let clientQuery = `
            SELECT 
              c.id, c.first_name || ' ' || c.last_name as client_name,
              c.email, pa.access_level,
              COUNT(ps.id) as session_count,
              MAX(ps.created_at) as last_login,
              COUNT(pact.id) as total_activities
            FROM crm_clients c
            LEFT JOIN client_portal_access pa ON c.id = pa.client_id
            LEFT JOIN client_portal_sessions ps ON c.id = ps.client_id AND ps.created_at >= $1
            LEFT JOIN client_portal_activity pact ON c.id = pact.client_id AND pact.created_at >= $1
          `;

          const activityParams = [dateFilter];

          if (params.client_id) {
            clientQuery += ' WHERE c.id = $2';
            activityParams.push(params.client_id);
          }

          clientQuery += `
            GROUP BY c.id, c.first_name, c.last_name, c.email, pa.access_level
            ORDER BY session_count DESC
          `;

          const clientActivity = await sql(clientQuery, activityParams);

          analytics.client_activity = clientActivity.map(client => ({
            id: client.id,
            name: client.client_name,
            email: client.email,
            access_level: client.access_level || 'none',
            sessions: client.session_count || 0,
            last_login: client.last_login || 'Never',
            activities: client.total_activities || 0,
            engagement_score: Math.min(100, ((client.session_count || 0) * 10) + ((client.total_activities || 0) * 2))
          }));
          break;
      }

      return analytics;
    } catch (error) {
      return {
        success: false,
        error: `Failed to read portal analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Update Portal Settings Tool
export const updatePortalSettingsTool = {
  name: "update_portal_settings",
  description: "Update client portal configurations, permissions, and display settings",
  parameters: z.object({
    client_id: z.string().uuid("Valid client ID required"),
    settings_update: z.object({
      access_level: z.enum(["basic", "premium", "full"]).optional(),
      features: z.array(z.enum(["galleries", "invoices", "bookings", "files", "communication"])).optional(),
      portal_settings: z.object({
        auto_login: z.boolean().optional(),
        email_notifications: z.boolean().optional(),
        mobile_access: z.boolean().optional(),
        custom_branding: z.boolean().optional(),
        theme: z.enum(["light", "dark", "auto"]).optional()
      }).optional(),
      active: z.boolean().optional()
    })
  }),
  execute: async (params: any) => {
    try {
      // Check if portal access exists
      const portalAccess = await sql`
        SELECT id, client_id, access_level, features, portal_settings
        FROM client_portal_access
        WHERE client_id = ${params.client_id}
      `;

      if (portalAccess.length === 0) {
        return { success: false, error: "Portal access not found for client" };
      }

      const currentAccess = portalAccess[0];
      const updates = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(params.settings_update).forEach(key => {
        if (params.settings_update[key] !== undefined) {
          if (key === 'features') {
            updates.push(`features = $${paramIndex}`);
            values.push(JSON.stringify(params.settings_update[key]));
          } else if (key === 'portal_settings') {
            // Merge with existing portal settings
            const currentSettings = currentAccess.portal_settings ? 
              JSON.parse(currentAccess.portal_settings) : {};
            const newSettings = { ...currentSettings, ...params.settings_update[key] };
            updates.push(`portal_settings = $${paramIndex}`);
            values.push(JSON.stringify(newSettings));
          } else {
            updates.push(`${key} = $${paramIndex}`);
            values.push(params.settings_update[key]);
          }
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        return { success: false, error: "No settings updates provided" };
      }

      updates.push('updated_at = NOW()');
      values.push(params.client_id);

      const updateQuery = `
        UPDATE client_portal_access 
        SET ${updates.join(', ')}
        WHERE client_id = $${paramIndex}
        RETURNING id, access_level, features, portal_settings, active, updated_at
      `;

      const result = await sql(updateQuery, values);

      return {
        success: true,
        message: "Portal settings updated successfully",
        portal: {
          id: result[0].id,
          access_level: result[0].access_level,
          features: Array.isArray(result[0].features) ? 
            result[0].features : JSON.parse(result[0].features || '[]'),
          portal_settings: result[0].portal_settings ? 
            JSON.parse(result[0].portal_settings) : {},
          active: result[0].active,
          updated_at: result[0].updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update portal settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Send Portal Notifications Tool
export const sendPortalNotificationsTool = {
  name: "send_portal_notifications",
  description: "Send notifications to clients about new content, updates, or system messages",
  parameters: z.object({
    notification_type: z.enum(["new_content", "system_update", "custom_message", "reminder"]),
    client_ids: z.array(z.string().uuid()).min(1, "At least one client ID required"),
    notification_data: z.object({
      title: z.string().min(1, "Title required"),
      message: z.string().min(1, "Message required"),
      action_url: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      expires_at: z.string().optional()
    })
  }),
  execute: async (params: any) => {
    try {
      const notifications = [];

      for (const clientId of params.client_ids) {
        const notificationId = crypto.randomUUID();

        await sql`
          INSERT INTO client_portal_notifications (
            id, client_id, notification_type, title, message,
            action_url, priority, expires_at, read_status,
            created_at, updated_at
          ) VALUES (
            ${notificationId}, ${clientId}, ${params.notification_type},
            ${params.notification_data.title}, ${params.notification_data.message},
            ${params.notification_data.action_url || null}, ${params.notification_data.priority},
            ${params.notification_data.expires_at ? new Date(params.notification_data.expires_at) : null},
            false, NOW(), NOW()
          )
        `;

        notifications.push({
          id: notificationId,
          client_id: clientId,
          type: params.notification_type,
          title: params.notification_data.title
        });
      }

      return {
        success: true,
        message: `${notifications.length} portal notifications sent successfully`,
        notifications: notifications
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send portal notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const customerPortalManagementTools = [
  createPortalAccessTool,
  managePortalContentTool,
  readPortalAnalyticsTool,
  updatePortalSettingsTool,
  sendPortalNotificationsTool
];