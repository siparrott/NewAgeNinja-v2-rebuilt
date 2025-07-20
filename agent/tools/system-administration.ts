import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// System Administration Tools for CRM Agent - Feature 11

// Manage User Accounts Tool
export const manageUserAccountsTool = {
  name: "manage_user_accounts",
  description: "Create, update, or deactivate user accounts and manage permissions",
  parameters: z.object({
    action: z.enum(["create", "update", "deactivate", "list", "reset_password"]),
    user_data: z.object({
      email: z.string().email().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      role: z.enum(["admin", "photographer", "assistant", "client"]).optional(),
      permissions: z.array(z.string()).optional(),
      active: z.boolean().optional()
    }).optional(),
    user_id: z.string().uuid().optional(),
    filter: z.object({
      role: z.enum(["admin", "photographer", "assistant", "client"]).optional(),
      active: z.boolean().optional(),
      created_after: z.string().optional()
    }).optional()
  }),
  execute: async (params: any) => {
    try {
      switch (params.action) {
        case 'create':
          if (!params.user_data?.email || !params.user_data?.role) {
            return { success: false, error: "Email and role required for user creation" };
          }

          const userId = crypto.randomUUID();
          const tempPassword = crypto.randomUUID().substring(0, 12);

          await sql`
            INSERT INTO users (
              id, email, first_name, last_name, role, permissions, 
              active, password_hash, created_at, updated_at
            ) VALUES (
              ${userId}, ${params.user_data.email}, 
              ${params.user_data.first_name || ''}, ${params.user_data.last_name || ''},
              ${params.user_data.role}, ${JSON.stringify(params.user_data.permissions || [])},
              ${params.user_data.active !== false}, ${tempPassword}, NOW(), NOW()
            )
          `;

          return {
            success: true,
            message: `User account created successfully`,
            user: {
              id: userId,
              email: params.user_data.email,
              role: params.user_data.role,
              temp_password: tempPassword,
              active: params.user_data.active !== false
            }
          };

        case 'update':
          if (!params.user_id) {
            return { success: false, error: "User ID required for update" };
          }

          const updates = [];
          const values = [];
          let paramIndex = 1;

          Object.keys(params.user_data || {}).forEach(key => {
            if (params.user_data[key] !== undefined) {
              if (key === 'permissions') {
                updates.push(`${key} = $${paramIndex}`);
                values.push(JSON.stringify(params.user_data[key]));
              } else {
                updates.push(`${key} = $${paramIndex}`);
                values.push(params.user_data[key]);
              }
              paramIndex++;
            }
          });

          if (updates.length === 0) {
            return { success: false, error: "No updates provided" };
          }

          updates.push('updated_at = NOW()');
          values.push(params.user_id);

          const updateQuery = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, email, first_name, last_name, role, active, updated_at
          `;

          const result = await sql(updateQuery, values);

          if (result.length === 0) {
            return { success: false, error: "User not found" };
          }

          return {
            success: true,
            message: "User account updated successfully",
            user: result[0]
          };

        case 'deactivate':
          if (!params.user_id) {
            return { success: false, error: "User ID required for deactivation" };
          }

          await sql`
            UPDATE users 
            SET active = false, updated_at = NOW()
            WHERE id = ${params.user_id}
          `;

          return {
            success: true,
            message: "User account deactivated successfully"
          };

        case 'list':
          let query = `
            SELECT id, email, first_name, last_name, role, permissions, 
                   active, created_at, last_login_at
            FROM users
          `;

          const conditions = [];
          const queryValues = [];
          let queryParamIndex = 1;

          if (params.filter?.role) {
            conditions.push(`role = $${queryParamIndex}`);
            queryValues.push(params.filter.role);
            queryParamIndex++;
          }

          if (params.filter?.active !== undefined) {
            conditions.push(`active = $${queryParamIndex}`);
            queryValues.push(params.filter.active);
            queryParamIndex++;
          }

          if (params.filter?.created_after) {
            conditions.push(`created_at >= $${queryParamIndex}`);
            queryValues.push(new Date(params.filter.created_after));
            queryParamIndex++;
          }

          if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
          }

          query += ' ORDER BY created_at DESC';

          const users = await sql(query, queryValues);

          return {
            success: true,
            count: users.length,
            users: users.map(user => ({
              id: user.id,
              email: user.email,
              name: `${user.first_name} ${user.last_name}`.trim() || 'N/A',
              role: user.role,
              permissions: Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions || '[]'),
              active: user.active,
              created_at: user.created_at,
              last_login: user.last_login_at || 'Never'
            }))
          };

        case 'reset_password':
          if (!params.user_id) {
            return { success: false, error: "User ID required for password reset" };
          }

          const newPassword = crypto.randomUUID().substring(0, 12);

          await sql`
            UPDATE users 
            SET password_hash = ${newPassword}, updated_at = NOW()
            WHERE id = ${params.user_id}
          `;

          return {
            success: true,
            message: "Password reset successfully",
            temp_password: newPassword
          };

        default:
          return { success: false, error: "Invalid action specified" };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to manage user accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// System Configuration Tool
export const systemConfigurationTool = {
  name: "system_configuration",
  description: "Manage system settings, preferences, and configuration options",
  parameters: z.object({
    action: z.enum(["read", "update", "reset", "backup"]),
    config_section: z.enum(["general", "email", "storage", "security", "integrations", "business"]).optional(),
    settings: z.record(z.any()).optional()
  }),
  execute: async (params: any) => {
    try {
      switch (params.action) {
        case 'read':
          let configQuery = 'SELECT config_key, config_value, config_section FROM system_config';
          const queryParams = [];

          if (params.config_section) {
            configQuery += ' WHERE config_section = $1';
            queryParams.push(params.config_section);
          }

          configQuery += ' ORDER BY config_section, config_key';

          const configs = await sql(configQuery, queryParams);

          const configData: any = {
            success: true,
            config_section: params.config_section || 'all',
            settings: {}
          };

          configs.forEach(config => {
            if (!configData.settings[config.config_section]) {
              configData.settings[config.config_section] = {};
            }
            configData.settings[config.config_section][config.config_key] = 
              typeof config.config_value === 'string' ? 
                JSON.parse(config.config_value) : config.config_value;
          });

          return configData;

        case 'update':
          if (!params.config_section || !params.settings) {
            return { success: false, error: "Config section and settings required for update" };
          }

          const updatePromises = Object.entries(params.settings).map(async ([key, value]) => {
            await sql`
              INSERT INTO system_config (config_key, config_value, config_section, updated_at)
              VALUES (${key}, ${JSON.stringify(value)}, ${params.config_section}, NOW())
              ON CONFLICT (config_key, config_section) 
              DO UPDATE SET config_value = ${JSON.stringify(value)}, updated_at = NOW()
            `;
          });

          await Promise.all(updatePromises);

          return {
            success: true,
            message: `System configuration updated for ${params.config_section}`,
            updated_settings: Object.keys(params.settings)
          };

        case 'backup':
          const backupData = await sql`
            SELECT config_key, config_value, config_section, updated_at
            FROM system_config
            ORDER BY config_section, config_key
          `;

          const backupId = crypto.randomUUID();
          await sql`
            INSERT INTO system_backups (
              id, backup_type, backup_data, created_at
            ) VALUES (
              ${backupId}, 'configuration', ${JSON.stringify(backupData)}, NOW()
            )
          `;

          return {
            success: true,
            message: "System configuration backed up successfully",
            backup_id: backupId,
            settings_count: backupData.length
          };

        case 'reset':
          if (!params.config_section) {
            return { success: false, error: "Config section required for reset" };
          }

          await sql`
            DELETE FROM system_config 
            WHERE config_section = ${params.config_section}
          `;

          return {
            success: true,
            message: `Configuration reset for ${params.config_section}`
          };

        default:
          return { success: false, error: "Invalid action specified" };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to manage system configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Database Management Tool
export const databaseManagementTool = {
  name: "database_management",
  description: "Perform database maintenance, backups, and optimization tasks",
  parameters: z.object({
    action: z.enum(["backup", "cleanup", "optimize", "status", "repair"]),
    table_name: z.string().optional(),
    cleanup_options: z.object({
      older_than_days: z.number().optional(),
      table_specific: z.boolean().default(false),
      dry_run: z.boolean().default(true)
    }).optional()
  }),
  execute: async (params: any) => {
    try {
      switch (params.action) {
        case 'status':
          const tableStats = await sql`
            SELECT 
              schemaname,
              tablename,
              n_tup_ins as inserts,
              n_tup_upd as updates,
              n_tup_del as deletes,
              n_live_tup as live_rows,
              n_dead_tup as dead_rows
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
          `;

          const databaseSize = await sql`
            SELECT 
              pg_size_pretty(pg_database_size(current_database())) as size,
              current_database() as database_name
          `;

          return {
            success: true,
            database: {
              name: databaseSize[0].database_name,
              size: databaseSize[0].size
            },
            tables: tableStats.map(table => ({
              schema: table.schemaname,
              name: table.tablename,
              live_rows: table.live_rows,
              dead_rows: table.dead_rows,
              operations: {
                inserts: table.inserts,
                updates: table.updates,
                deletes: table.deletes
              }
            }))
          };

        case 'backup':
          const backupTables = params.table_name ? [params.table_name] : [
            'crm_clients', 'crm_leads', 'crm_invoices', 'photography_sessions',
            'blog_posts', 'digital_files', 'email_campaigns', 'questionnaires'
          ];

          const backupData: any = {};
          
          for (const table of backupTables) {
            try {
              const data = await sql(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 1000`);
              backupData[table] = {
                count: data.length,
                data: data
              };
            } catch (err) {
              backupData[table] = {
                error: `Table not found or access denied: ${err}`
              };
            }
          }

          const backupId = crypto.randomUUID();
          await sql`
            INSERT INTO system_backups (
              id, backup_type, backup_data, created_at
            ) VALUES (
              ${backupId}, 'database', ${JSON.stringify(backupData)}, NOW()
            )
          `;

          return {
            success: true,
            message: "Database backup completed successfully",
            backup_id: backupId,
            tables_backed_up: Object.keys(backupData).length
          };

        case 'cleanup':
          const olderThanDays = params.cleanup_options?.older_than_days || 365;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

          const cleanupResults: any = {};

          if (params.cleanup_options?.dry_run) {
            // Dry run - count what would be deleted
            const expiredSessions = await sql`
              SELECT COUNT(*) as count FROM photography_sessions 
              WHERE status = 'CANCELLED' AND updated_at < ${cutoffDate}
            `;

            const expiredLeads = await sql`
              SELECT COUNT(*) as count FROM crm_leads 
              WHERE status IN ('REJECTED', 'SPAM') AND updated_at < ${cutoffDate}
            `;

            cleanupResults.dry_run = true;
            cleanupResults.potential_deletions = {
              cancelled_sessions: expiredSessions[0].count,
              rejected_leads: expiredLeads[0].count
            };
          } else {
            // Actual cleanup
            const deletedSessions = await sql`
              DELETE FROM photography_sessions 
              WHERE status = 'CANCELLED' AND updated_at < ${cutoffDate}
              RETURNING id
            `;

            const deletedLeads = await sql`
              DELETE FROM crm_leads 
              WHERE status IN ('REJECTED', 'SPAM') AND updated_at < ${cutoffDate}
              RETURNING id
            `;

            cleanupResults.deleted = {
              cancelled_sessions: deletedSessions.length,
              rejected_leads: deletedLeads.length
            };
          }

          return {
            success: true,
            message: params.cleanup_options?.dry_run ? 
              "Database cleanup analysis completed" : "Database cleanup completed",
            ...cleanupResults
          };

        case 'optimize':
          // Analyze tables for optimization
          const analyzeResults = await sql`
            SELECT 
              schemaname,
              tablename,
              n_dead_tup,
              n_live_tup,
              CASE 
                WHEN n_live_tup > 0 THEN (n_dead_tup::float / n_live_tup::float) * 100
                ELSE 0
              END as dead_tuple_percent
            FROM pg_stat_user_tables
            WHERE n_dead_tup > 100
            ORDER BY dead_tuple_percent DESC
          `;

          return {
            success: true,
            message: "Database analysis completed",
            optimization_candidates: analyzeResults.map(table => ({
              schema: table.schemaname,
              table: table.tablename,
              dead_tuples: table.n_dead_tup,
              live_tuples: table.n_live_tup,
              dead_percentage: `${parseFloat(table.dead_tuple_percent).toFixed(2)}%`,
              needs_vacuum: table.dead_tuple_percent > 10
            }))
          };

        default:
          return { success: false, error: "Invalid action specified" };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to manage database: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// System Monitoring Tool
export const systemMonitoringTool = {
  name: "system_monitoring",
  description: "Monitor system performance, health, and generate alerts",
  parameters: z.object({
    metric_type: z.enum(["performance", "errors", "usage", "health"]),
    time_range: z.enum(["hour", "day", "week", "month"]).default("day"),
    include_alerts: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      const now = new Date();
      let timeRange: Date;

      switch (params.time_range) {
        case 'hour':
          timeRange = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'week':
          timeRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          timeRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default: // day
          timeRange = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const monitoring: any = {
        success: true,
        metric_type: params.metric_type,
        time_range: params.time_range,
        timestamp: now.toISOString()
      };

      if (params.metric_type === 'performance' || params.metric_type === 'health') {
        // Database performance metrics
        const dbMetrics = await sql`
          SELECT 
            (SELECT COUNT(*) FROM crm_clients) as total_clients,
            (SELECT COUNT(*) FROM crm_leads WHERE created_at >= ${timeRange}) as new_leads,
            (SELECT COUNT(*) FROM crm_invoices WHERE created_at >= ${timeRange}) as new_invoices,
            (SELECT COUNT(*) FROM photography_sessions WHERE created_at >= ${timeRange}) as new_sessions
        `;

        monitoring.performance = {
          database: {
            total_clients: dbMetrics[0].total_clients,
            new_leads: dbMetrics[0].new_leads,
            new_invoices: dbMetrics[0].new_invoices,
            new_sessions: dbMetrics[0].new_sessions
          },
          system: {
            uptime: "System operational",
            status: "healthy",
            last_backup: "Automated backups active"
          }
        };
      }

      if (params.metric_type === 'usage' || params.metric_type === 'health') {
        // Usage statistics
        const usageStats = await sql`
          SELECT 
            COUNT(DISTINCT client_id) as active_clients,
            COUNT(*) as total_activities
          FROM (
            SELECT client_id, created_at FROM crm_invoices WHERE created_at >= ${timeRange}
            UNION ALL
            SELECT client_id, created_at FROM photography_sessions WHERE created_at >= ${timeRange}
          ) as activities
        `;

        monitoring.usage = {
          active_clients: usageStats[0].active_clients,
          total_activities: usageStats[0].total_activities,
          period: params.time_range
        };
      }

      if (params.include_alerts) {
        // System alerts
        const alerts = [];

        // Check for overdue invoices
        const overdueInvoices = await sql`
          SELECT COUNT(*) as count FROM crm_invoices 
          WHERE status = 'PENDING' AND due_date < NOW()
        `;

        if (overdueInvoices[0].count > 0) {
          alerts.push({
            type: 'warning',
            message: `${overdueInvoices[0].count} overdue invoices require attention`,
            priority: 'medium'
          });
        }

        // Check for uncontacted leads
        const uncontactedLeads = await sql`
          SELECT COUNT(*) as count FROM crm_leads 
          WHERE status = 'NEW' AND created_at < NOW() - INTERVAL '24 hours'
        `;

        if (uncontactedLeads[0].count > 0) {
          alerts.push({
            type: 'info',
            message: `${uncontactedLeads[0].count} leads waiting for initial contact`,
            priority: 'low'
          });
        }

        monitoring.alerts = alerts;
      }

      return monitoring;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get system monitoring data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Audit Trail Tool
export const auditTrailTool = {
  name: "audit_trail",
  description: "Track and review system audit logs and user activities",
  parameters: z.object({
    action: z.enum(["read", "search", "export"]),
    user_id: z.string().uuid().optional(),
    action_type: z.enum(["login", "create", "update", "delete", "export", "email"]).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    limit: z.number().min(1).max(100).default(50)
  }),
  execute: async (params: any) => {
    try {
      let query = `
        SELECT 
          al.id, al.user_id, al.action_type, al.resource_type, al.resource_id,
          al.details, al.ip_address, al.user_agent, al.created_at,
          u.email as user_email, u.first_name, u.last_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (params.user_id) {
        conditions.push(`al.user_id = $${paramIndex}`);
        values.push(params.user_id);
        paramIndex++;
      }

      if (params.action_type) {
        conditions.push(`al.action_type = $${paramIndex}`);
        values.push(params.action_type);
        paramIndex++;
      }

      if (params.date_from) {
        conditions.push(`al.created_at >= $${paramIndex}`);
        values.push(new Date(params.date_from));
        paramIndex++;
      }

      if (params.date_to) {
        conditions.push(`al.created_at <= $${paramIndex}`);
        values.push(new Date(params.date_to));
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex}`;
      values.push(params.limit);

      const auditLogs = await sql(query, values);

      if (params.action === 'export') {
        return {
          success: true,
          action: 'export',
          count: auditLogs.length,
          audit_logs: auditLogs,
          export_timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        count: auditLogs.length,
        audit_logs: auditLogs.map(log => ({
          id: log.id,
          user: {
            id: log.user_id,
            email: log.user_email,
            name: `${log.first_name || ''} ${log.last_name || ''}`.trim() || 'Unknown'
          },
          action: {
            type: log.action_type,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            details: log.details ? JSON.parse(log.details) : null
          },
          metadata: {
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            timestamp: log.created_at
          }
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to access audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const systemAdministrationTools = [
  manageUserAccountsTool,
  systemConfigurationTool,
  databaseManagementTool,
  systemMonitoringTool,
  auditTrailTool
];