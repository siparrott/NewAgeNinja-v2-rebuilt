import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Automation Management Tools for CRM Agent - Feature 13

// Create Automation Workflow Tool
export const createAutomationWorkflowTool = {
  name: "create_automation_workflow",
  description: "Create automated workflows for client onboarding, follow-ups, reminders, and business processes",
  parameters: z.object({
    workflow_name: z.string().min(1, "Workflow name required"),
    description: z.string().optional(),
    trigger_type: z.enum(["form_submission", "booking_confirmed", "payment_received", "date_based", "manual", "email_received"]),
    trigger_conditions: z.object({
      form_type: z.string().optional(),
      booking_type: z.string().optional(),
      amount_threshold: z.number().optional(),
      schedule: z.string().optional(),
      email_criteria: z.string().optional()
    }).optional(),
    actions: z.array(z.object({
      action_type: z.enum(["send_email", "create_task", "update_client", "schedule_session", "send_sms", "create_invoice"]),
      delay_minutes: z.number().min(0).default(0),
      parameters: z.record(z.any()),
      order: z.number()
    })).min(1, "At least one action required"),
    active: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      const workflowId = crypto.randomUUID();

      // Create automation workflow
      await sql`
        INSERT INTO automation_workflows (
          id, workflow_name, description, trigger_type, trigger_conditions,
          active, created_at, updated_at
        ) VALUES (
          ${workflowId}, ${params.workflow_name}, ${params.description || ''},
          ${params.trigger_type}, ${JSON.stringify(params.trigger_conditions || {})},
          ${params.active}, NOW(), NOW()
        )
      `;

      // Create workflow actions
      for (const action of params.actions) {
        const actionId = crypto.randomUUID();
        await sql`
          INSERT INTO automation_actions (
            id, workflow_id, action_type, delay_minutes, parameters,
            action_order, created_at
          ) VALUES (
            ${actionId}, ${workflowId}, ${action.action_type}, ${action.delay_minutes},
            ${JSON.stringify(action.parameters)}, ${action.order}, NOW()
          )
        `;
      }

      return {
        success: true,
        workflow_id: workflowId,
        message: `Automation workflow "${params.workflow_name}" created successfully`,
        details: {
          name: params.workflow_name,
          trigger: params.trigger_type,
          actions_count: params.actions.length,
          active: params.active
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create automation workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Manage Automated Triggers Tool
export const manageAutomatedTriggersTool = {
  name: "manage_automated_triggers",
  description: "Configure and monitor automated triggers for workflows and business events",
  parameters: z.object({
    action: z.enum(["list", "create", "update", "delete", "test"]),
    trigger_id: z.string().uuid().optional(),
    trigger_config: z.object({
      name: z.string().optional(),
      event_type: z.enum(["client_created", "lead_converted", "invoice_paid", "session_completed", "email_opened"]).optional(),
      conditions: z.record(z.any()).optional(),
      enabled: z.boolean().optional()
    }).optional()
  }),
  execute: async (params: any) => {
    try {
      switch (params.action) {
        case 'list':
          const triggers = await sql`
            SELECT 
              id, trigger_name, event_type, conditions, enabled,
              last_triggered, trigger_count, created_at
            FROM automation_triggers
            ORDER BY trigger_name
          `;

          return {
            success: true,
            count: triggers.length,
            triggers: triggers.map(trigger => ({
              id: trigger.id,
              name: trigger.trigger_name,
              event_type: trigger.event_type,
              conditions: trigger.conditions ? JSON.parse(trigger.conditions) : {},
              enabled: trigger.enabled,
              last_triggered: trigger.last_triggered || 'Never',
              trigger_count: trigger.trigger_count || 0,
              created_at: trigger.created_at
            }))
          };

        case 'create':
          if (!params.trigger_config?.name || !params.trigger_config?.event_type) {
            return { success: false, error: "Trigger name and event type required" };
          }

          const triggerId = crypto.randomUUID();

          await sql`
            INSERT INTO automation_triggers (
              id, trigger_name, event_type, conditions, enabled, created_at
            ) VALUES (
              ${triggerId}, ${params.trigger_config.name}, ${params.trigger_config.event_type},
              ${JSON.stringify(params.trigger_config.conditions || {})}, 
              ${params.trigger_config.enabled !== false}, NOW()
            )
          `;

          return {
            success: true,
            message: `Trigger "${params.trigger_config.name}" created successfully`,
            trigger_id: triggerId
          };

        case 'update':
          if (!params.trigger_id) {
            return { success: false, error: "Trigger ID required for update" };
          }

          const updates = [];
          const values = [];
          let paramIndex = 1;

          Object.keys(params.trigger_config || {}).forEach(key => {
            if (params.trigger_config[key] !== undefined) {
              if (key === 'conditions') {
                updates.push(`${key} = $${paramIndex}`);
                values.push(JSON.stringify(params.trigger_config[key]));
              } else {
                updates.push(`${key === 'name' ? 'trigger_name' : key} = $${paramIndex}`);
                values.push(params.trigger_config[key]);
              }
              paramIndex++;
            }
          });

          if (updates.length === 0) {
            return { success: false, error: "No updates provided" };
          }

          updates.push('updated_at = NOW()');
          values.push(params.trigger_id);

          const updateQuery = `
            UPDATE automation_triggers 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, trigger_name, event_type, enabled
          `;

          const result = await sql(updateQuery, values);

          if (result.length === 0) {
            return { success: false, error: "Trigger not found" };
          }

          return {
            success: true,
            message: "Trigger updated successfully",
            trigger: result[0]
          };

        case 'test':
          if (!params.trigger_id) {
            return { success: false, error: "Trigger ID required for testing" };
          }

          const trigger = await sql`
            SELECT trigger_name, event_type, conditions
            FROM automation_triggers
            WHERE id = ${params.trigger_id}
          `;

          if (trigger.length === 0) {
            return { success: false, error: "Trigger not found" };
          }

          // Simulate trigger test
          await sql`
            UPDATE automation_triggers 
            SET 
              last_triggered = NOW(),
              trigger_count = COALESCE(trigger_count, 0) + 1
            WHERE id = ${params.trigger_id}
          `;

          return {
            success: true,
            message: `Trigger "${trigger[0].trigger_name}" test completed successfully`,
            test_result: {
              event_type: trigger[0].event_type,
              conditions_met: true,
              actions_executed: 'Simulated execution',
              timestamp: new Date().toISOString()
            }
          };

        case 'delete':
          if (!params.trigger_id) {
            return { success: false, error: "Trigger ID required for deletion" };
          }

          await sql`
            DELETE FROM automation_triggers 
            WHERE id = ${params.trigger_id}
          `;

          return {
            success: true,
            message: "Trigger deleted successfully"
          };

        default:
          return { success: false, error: "Invalid action specified" };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to manage automated triggers: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Schedule Automated Tasks Tool
export const scheduleAutomatedTasksTool = {
  name: "schedule_automated_tasks",
  description: "Schedule recurring tasks like follow-ups, reminders, reports, and maintenance",
  parameters: z.object({
    task_name: z.string().min(1, "Task name required"),
    task_type: z.enum(["email_reminder", "follow_up", "report_generation", "data_cleanup", "backup", "sync"]),
    schedule_type: z.enum(["once", "daily", "weekly", "monthly", "custom_cron"]),
    schedule_config: z.object({
      start_date: z.string().optional(),
      time: z.string().optional(),
      day_of_week: z.number().min(0).max(6).optional(),
      day_of_month: z.number().min(1).max(31).optional(),
      cron_expression: z.string().optional()
    }).optional(),
    task_parameters: z.record(z.any()).optional(),
    active: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      const taskId = crypto.randomUUID();

      // Create scheduled task
      await sql`
        INSERT INTO scheduled_tasks (
          id, task_name, task_type, schedule_type, schedule_config,
          task_parameters, active, created_at, updated_at
        ) VALUES (
          ${taskId}, ${params.task_name}, ${params.task_type}, ${params.schedule_type},
          ${JSON.stringify(params.schedule_config || {})}, 
          ${JSON.stringify(params.task_parameters || {})}, ${params.active}, NOW(), NOW()
        )
      `;

      return {
        success: true,
        task_id: taskId,
        message: `Scheduled task "${params.task_name}" created successfully`,
        details: {
          name: params.task_name,
          type: params.task_type,
          schedule: params.schedule_type,
          active: params.active,
          next_run: params.schedule_config?.start_date || 'Immediate'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to schedule automated task: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Automation Status Tool
export const readAutomationStatusTool = {
  name: "read_automation_status",
  description: "Monitor automation execution status, performance, and logs",
  parameters: z.object({
    status_type: z.enum(["workflows", "triggers", "scheduled_tasks", "execution_logs", "performance"]),
    time_range: z.enum(["today", "week", "month"]).default("today"),
    workflow_id: z.string().uuid().optional(),
    include_details: z.boolean().default(false)
  }),
  execute: async (params: any) => {
    try {
      const timeRange = params.time_range;
      let dateFilter: Date;

      switch (timeRange) {
        case 'week':
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default: // today
          dateFilter = new Date();
          dateFilter.setHours(0, 0, 0, 0);
      }

      const status: any = {
        success: true,
        status_type: params.status_type,
        time_range: params.time_range,
        timestamp: new Date().toISOString()
      };

      switch (params.status_type) {
        case 'workflows':
          const workflows = await sql`
            SELECT 
              id, workflow_name, trigger_type, active,
              last_executed, execution_count, created_at
            FROM automation_workflows
            ORDER BY workflow_name
          `;

          status.workflows = {
            total: workflows.length,
            active: workflows.filter(w => w.active).length,
            workflows: workflows.map(workflow => ({
              id: workflow.id,
              name: workflow.workflow_name,
              trigger_type: workflow.trigger_type,
              active: workflow.active,
              last_executed: workflow.last_executed || 'Never',
              execution_count: workflow.execution_count || 0,
              status: workflow.active ? 'running' : 'paused'
            }))
          };
          break;

        case 'triggers':
          const triggers = await sql`
            SELECT 
              id, trigger_name, event_type, enabled,
              last_triggered, trigger_count
            FROM automation_triggers
            WHERE last_triggered >= ${dateFilter} OR last_triggered IS NULL
            ORDER BY trigger_count DESC
          `;

          status.triggers = {
            total: triggers.length,
            active: triggers.filter(t => t.enabled).length,
            triggered_today: triggers.filter(t => 
              t.last_triggered && new Date(t.last_triggered) > dateFilter
            ).length,
            triggers: triggers.map(trigger => ({
              id: trigger.id,
              name: trigger.trigger_name,
              event_type: trigger.event_type,
              enabled: trigger.enabled,
              last_triggered: trigger.last_triggered || 'Never',
              trigger_count: trigger.trigger_count || 0
            }))
          };
          break;

        case 'scheduled_tasks':
          const tasks = await sql`
            SELECT 
              id, task_name, task_type, schedule_type, active,
              last_executed, next_execution, execution_count
            FROM scheduled_tasks
            ORDER BY next_execution ASC
          `;

          status.scheduled_tasks = {
            total: tasks.length,
            active: tasks.filter(t => t.active).length,
            due_soon: tasks.filter(t => 
              t.next_execution && new Date(t.next_execution) < new Date(Date.now() + 24 * 60 * 60 * 1000)
            ).length,
            tasks: tasks.map(task => ({
              id: task.id,
              name: task.task_name,
              type: task.task_type,
              schedule: task.schedule_type,
              active: task.active,
              last_executed: task.last_executed || 'Never',
              next_execution: task.next_execution || 'Not scheduled',
              execution_count: task.execution_count || 0
            }))
          };
          break;

        case 'execution_logs':
          let logQuery = `
            SELECT 
              id, workflow_id, trigger_id, execution_status, 
              started_at, completed_at, error_message, actions_completed
            FROM automation_executions
            WHERE started_at >= $1
          `;
          const logParams = [dateFilter];

          if (params.workflow_id) {
            logQuery += ' AND workflow_id = $2';
            logParams.push(params.workflow_id);
          }

          logQuery += ' ORDER BY started_at DESC LIMIT 100';

          const executions = await sql(logQuery, logParams);

          status.execution_logs = {
            total_executions: executions.length,
            successful: executions.filter(e => e.execution_status === 'completed').length,
            failed: executions.filter(e => e.execution_status === 'failed').length,
            running: executions.filter(e => e.execution_status === 'running').length,
            executions: executions.map(execution => ({
              id: execution.id,
              workflow_id: execution.workflow_id,
              trigger_id: execution.trigger_id,
              status: execution.execution_status,
              started_at: execution.started_at,
              completed_at: execution.completed_at,
              duration: execution.completed_at ? 
                `${Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)}s` : 'Running',
              actions_completed: execution.actions_completed || 0,
              error: execution.error_message || null
            }))
          };
          break;

        case 'performance':
          const performanceStats = await sql`
            SELECT 
              COUNT(*) as total_executions,
              COUNT(CASE WHEN execution_status = 'completed' THEN 1 END) as successful_executions,
              COUNT(CASE WHEN execution_status = 'failed' THEN 1 END) as failed_executions,
              AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_execution_time
            FROM automation_executions
            WHERE started_at >= ${dateFilter}
          `;

          const topWorkflows = await sql`
            SELECT 
              w.workflow_name,
              COUNT(e.id) as execution_count,
              AVG(EXTRACT(EPOCH FROM (e.completed_at - e.started_at))) as avg_duration
            FROM automation_workflows w
            LEFT JOIN automation_executions e ON w.id = e.workflow_id
            WHERE e.started_at >= ${dateFilter} OR e.started_at IS NULL
            GROUP BY w.id, w.workflow_name
            ORDER BY execution_count DESC
            LIMIT 10
          `;

          const stats = performanceStats[0];

          status.performance = {
            summary: {
              total_executions: stats.total_executions || 0,
              success_rate: stats.total_executions > 0 ? 
                `${((stats.successful_executions / stats.total_executions) * 100).toFixed(1)}%` : '0%',
              avg_execution_time: stats.avg_execution_time ? 
                `${Math.round(stats.avg_execution_time)}s` : 'N/A'
            },
            top_workflows: topWorkflows.map(workflow => ({
              name: workflow.workflow_name,
              executions: workflow.execution_count || 0,
              avg_duration: workflow.avg_duration ? 
                `${Math.round(workflow.avg_duration)}s` : 'N/A'
            }))
          };
          break;
      }

      return status;
    } catch (error) {
      return {
        success: false,
        error: `Failed to read automation status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Update Automation Settings Tool
export const updateAutomationSettingsTool = {
  name: "update_automation_settings",
  description: "Modify automation workflow settings, schedules, and configurations",
  parameters: z.object({
    target_type: z.enum(["workflow", "trigger", "scheduled_task"]),
    target_id: z.string().uuid("Valid UUID required"),
    updates: z.object({
      name: z.string().optional(),
      active: z.boolean().optional(),
      schedule: z.record(z.any()).optional(),
      parameters: z.record(z.any()).optional(),
      conditions: z.record(z.any()).optional()
    })
  }),
  execute: async (params: any) => {
    try {
      let updateQuery = '';
      let tableName = '';
      const updates = [];
      const values = [];
      let paramIndex = 1;

      switch (params.target_type) {
        case 'workflow':
          tableName = 'automation_workflows';
          break;
        case 'trigger':
          tableName = 'automation_triggers';
          break;
        case 'scheduled_task':
          tableName = 'scheduled_tasks';
          break;
      }

      Object.keys(params.updates).forEach(key => {
        if (params.updates[key] !== undefined) {
          switch (key) {
            case 'name':
              const nameField = params.target_type === 'workflow' ? 'workflow_name' : 
                              params.target_type === 'trigger' ? 'trigger_name' : 'task_name';
              updates.push(`${nameField} = $${paramIndex}`);
              values.push(params.updates[key]);
              break;
            case 'schedule':
            case 'parameters':
            case 'conditions':
              const jsonField = key === 'schedule' ? 'schedule_config' : 
                              key === 'parameters' ? 'task_parameters' : key;
              updates.push(`${jsonField} = $${paramIndex}`);
              values.push(JSON.stringify(params.updates[key]));
              break;
            default:
              updates.push(`${key} = $${paramIndex}`);
              values.push(params.updates[key]);
          }
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        return { success: false, error: "No updates provided" };
      }

      updates.push('updated_at = NOW()');
      values.push(params.target_id);

      updateQuery = `
        UPDATE ${tableName} 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, updated_at
      `;

      const result = await sql(updateQuery, values);

      if (result.length === 0) {
        return { success: false, error: `${params.target_type} not found` };
      }

      return {
        success: true,
        message: `${params.target_type} updated successfully`,
        target: {
          id: result[0].id,
          type: params.target_type,
          updated_at: result[0].updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update automation settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const automationManagementTools = [
  createAutomationWorkflowTool,
  manageAutomatedTriggersTool,
  scheduleAutomatedTasksTool,
  readAutomationStatusTool,
  updateAutomationSettingsTool
];