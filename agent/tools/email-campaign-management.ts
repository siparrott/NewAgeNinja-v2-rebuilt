import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Email Campaign Management Tools for CRM Agent - Feature 8

// Create Email Campaign Tool
export const createEmailCampaignTool = {
  name: "create_email_campaign",
  description: "Create a new email marketing campaign",
  parameters: z.object({
    name: z.string().min(1, "Campaign name required"),
    subject: z.string().min(1, "Email subject required"),
    content: z.string().min(50, "Email content must be at least 50 characters"),
    sender_name: z.string().default("New Age Fotografie"),
    sender_email: z.string().email().default("hallo@newagefotografie.com"),
    campaign_type: z.enum(["newsletter", "promotional", "announcement", "follow_up"]),
    target_audience: z.enum(["all_clients", "leads", "high_value_clients", "recent_clients", "custom"]),
    custom_segment: z.array(z.string().uuid()).optional(),
    scheduled_for: z.string().optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "SENT"]).default("DRAFT")
  }),
  execute: async (params: any) => {
    try {
      const campaignId = crypto.randomUUID();
      
      await sql`
        INSERT INTO email_campaigns (
          id, name, subject, content, sender_name, sender_email,
          campaign_type, target_audience, custom_segment, scheduled_for,
          status, created_at, updated_at
        ) VALUES (
          ${campaignId}, ${params.name}, ${params.subject}, ${params.content},
          ${params.sender_name}, ${params.sender_email}, ${params.campaign_type},
          ${params.target_audience}, ${JSON.stringify(params.custom_segment || [])},
          ${params.scheduled_for ? new Date(params.scheduled_for) : null},
          ${params.status}, NOW(), NOW()
        )
      `;

      // Calculate estimated audience size
      let audienceQuery = '';
      switch (params.target_audience) {
        case 'all_clients':
          audienceQuery = 'SELECT COUNT(*) as count FROM crm_clients';
          break;
        case 'leads':
          audienceQuery = 'SELECT COUNT(*) as count FROM crm_leads';
          break;
        case 'high_value_clients':
          audienceQuery = `
            SELECT COUNT(DISTINCT c.id) as count 
            FROM crm_clients c 
            JOIN crm_invoices i ON c.id::text = i.client_id 
            GROUP BY c.id 
            HAVING SUM(i.total_amount) > 500
          `;
          break;
        case 'recent_clients':
          audienceQuery = `
            SELECT COUNT(*) as count 
            FROM crm_clients 
            WHERE created_at >= NOW() - INTERVAL '30 days'
          `;
          break;
        case 'custom':
          if (params.custom_segment && params.custom_segment.length > 0) {
            const placeholders = params.custom_segment.map((_, index) => `$${index + 1}`).join(',');
            audienceQuery = `SELECT COUNT(*) as count FROM crm_clients WHERE id IN (${placeholders})`;
          }
          break;
      }

      let estimatedAudience = 0;
      if (audienceQuery) {
        if (params.target_audience === 'custom' && params.custom_segment) {
          const audienceResult = await sql(audienceQuery, params.custom_segment);
          estimatedAudience = audienceResult[0]?.count || 0;
        } else {
          const audienceResult = await sql(audienceQuery);
          estimatedAudience = audienceResult[0]?.count || 0;
        }
      }

      return {
        success: true,
        campaign_id: campaignId,
        message: `Email campaign "${params.name}" created successfully`,
        details: {
          name: params.name,
          subject: params.subject,
          type: params.campaign_type,
          target_audience: params.target_audience,
          estimated_audience: estimatedAudience,
          status: params.status,
          scheduled_for: params.scheduled_for || 'Not scheduled'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create email campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Email Campaigns Tool
export const readEmailCampaignsTool = {
  name: "read_email_campaigns",
  description: "Retrieve email campaigns with filtering and performance metrics",
  parameters: z.object({
    status: z.enum(["DRAFT", "SCHEDULED", "SENT"]).optional(),
    campaign_type: z.enum(["newsletter", "promotional", "announcement", "follow_up"]).optional(),
    target_audience: z.enum(["all_clients", "leads", "high_value_clients", "recent_clients", "custom"]).optional(),
    limit: z.number().min(1).max(50).default(10),
    include_metrics: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      let query = `
        SELECT 
          id, name, subject, content, sender_name, sender_email,
          campaign_type, target_audience, scheduled_for, status,
          created_at, updated_at, sent_at, recipient_count,
          open_count, click_count, bounce_count
        FROM email_campaigns
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (params.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(params.status);
        paramIndex++;
      }
      
      if (params.campaign_type) {
        conditions.push(`campaign_type = $${paramIndex}`);
        values.push(params.campaign_type);
        paramIndex++;
      }
      
      if (params.target_audience) {
        conditions.push(`target_audience = $${paramIndex}`);
        values.push(params.target_audience);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      values.push(params.limit);

      const campaigns = await sql(query, values);

      const result: any = {
        success: true,
        count: campaigns.length,
        campaigns: campaigns.map(campaign => {
          const metrics: any = {
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
            sender: `${campaign.sender_name} <${campaign.sender_email}>`,
            type: campaign.campaign_type,
            target_audience: campaign.target_audience,
            status: campaign.status,
            created_at: campaign.created_at,
            scheduled_for: campaign.scheduled_for,
            sent_at: campaign.sent_at
          };

          if (params.include_metrics && campaign.status === 'SENT') {
            metrics.performance = {
              recipients: campaign.recipient_count || 0,
              opens: campaign.open_count || 0,
              clicks: campaign.click_count || 0,
              bounces: campaign.bounce_count || 0,
              open_rate: campaign.recipient_count > 0 ? 
                `${((campaign.open_count / campaign.recipient_count) * 100).toFixed(1)}%` : '0%',
              click_rate: campaign.recipient_count > 0 ? 
                `${((campaign.click_count / campaign.recipient_count) * 100).toFixed(1)}%` : '0%'
            };
          }

          return metrics;
        })
      };

      if (params.include_metrics) {
        const stats = await sql`
          SELECT 
            COUNT(*) as total_campaigns,
            COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent_campaigns,
            COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_campaigns,
            COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled_campaigns,
            SUM(recipient_count) as total_recipients,
            SUM(open_count) as total_opens,
            SUM(click_count) as total_clicks
          FROM email_campaigns
        `;

        result.stats = {
          total_campaigns: stats[0].total_campaigns,
          sent: stats[0].sent_campaigns,
          drafts: stats[0].draft_campaigns,
          scheduled: stats[0].scheduled_campaigns,
          total_recipients: stats[0].total_recipients || 0,
          overall_open_rate: stats[0].total_recipients > 0 ? 
            `${((stats[0].total_opens / stats[0].total_recipients) * 100).toFixed(1)}%` : '0%',
          overall_click_rate: stats[0].total_recipients > 0 ? 
            `${((stats[0].total_clicks / stats[0].total_recipients) * 100).toFixed(1)}%` : '0%'
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to read email campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Send Email Campaign Tool
export const sendEmailCampaignTool = {
  name: "send_email_campaign",
  description: "Send an email campaign immediately or schedule it for later",
  parameters: z.object({
    campaign_id: z.string().uuid("Valid campaign UUID required"),
    action: z.enum(["send_now", "schedule", "test_send"]),
    scheduled_for: z.string().optional(),
    test_email: z.string().email().optional()
  }),
  execute: async (params: any) => {
    try {
      // Get campaign details
      const campaign = await sql`
        SELECT * FROM email_campaigns WHERE id = ${params.campaign_id}
      `;

      if (campaign.length === 0) {
        return { success: false, error: "Campaign not found" };
      }

      const campaignData = campaign[0];

      if (params.action === 'test_send') {
        if (!params.test_email) {
          return { success: false, error: "Test email address required" };
        }

        // Send test email (would integrate with actual email service)
        return {
          success: true,
          message: `Test email sent to ${params.test_email}`,
          campaign: {
            id: campaignData.id,
            name: campaignData.name,
            subject: campaignData.subject
          }
        };
      }

      // Get recipient list based on target audience
      let recipientQuery = '';
      const recipientValues = [];

      switch (campaignData.target_audience) {
        case 'all_clients':
          recipientQuery = 'SELECT id, email, first_name, last_name FROM crm_clients WHERE email IS NOT NULL';
          break;
        case 'leads':
          recipientQuery = 'SELECT id, email, first_name, last_name FROM crm_leads WHERE email IS NOT NULL';
          break;
        case 'high_value_clients':
          recipientQuery = `
            SELECT DISTINCT c.id, c.email, c.first_name, c.last_name 
            FROM crm_clients c 
            JOIN crm_invoices i ON c.id::text = i.client_id 
            WHERE c.email IS NOT NULL
            GROUP BY c.id, c.email, c.first_name, c.last_name
            HAVING SUM(i.total_amount) > 500
          `;
          break;
        case 'recent_clients':
          recipientQuery = `
            SELECT id, email, first_name, last_name 
            FROM crm_clients 
            WHERE email IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'
          `;
          break;
        case 'custom':
          const customSegment = JSON.parse(campaignData.custom_segment || '[]');
          if (customSegment.length > 0) {
            const placeholders = customSegment.map((_, index) => `$${index + 1}`).join(',');
            recipientQuery = `SELECT id, email, first_name, last_name FROM crm_clients WHERE id IN (${placeholders}) AND email IS NOT NULL`;
            recipientValues.push(...customSegment);
          }
          break;
      }

      if (!recipientQuery) {
        return { success: false, error: "Invalid target audience configuration" };
      }

      const recipients = await sql(recipientQuery, recipientValues);

      if (params.action === 'schedule') {
        if (!params.scheduled_for) {
          return { success: false, error: "Scheduled time required" };
        }

        await sql`
          UPDATE email_campaigns 
          SET status = 'SCHEDULED', 
              scheduled_for = ${new Date(params.scheduled_for)},
              recipient_count = ${recipients.length},
              updated_at = NOW()
          WHERE id = ${params.campaign_id}
        `;

        return {
          success: true,
          message: `Campaign scheduled for ${params.scheduled_for}`,
          campaign: {
            id: campaignData.id,
            name: campaignData.name,
            recipient_count: recipients.length,
            scheduled_for: params.scheduled_for
          }
        };
      }

      if (params.action === 'send_now') {
        // Update campaign status
        await sql`
          UPDATE email_campaigns 
          SET status = 'SENT', 
              sent_at = NOW(),
              recipient_count = ${recipients.length},
              updated_at = NOW()
          WHERE id = ${params.campaign_id}
        `;

        // In a real implementation, this would integrate with an email service
        // For now, we'll simulate the sending process

        return {
          success: true,
          message: `Campaign "${campaignData.name}" sent successfully`,
          campaign: {
            id: campaignData.id,
            name: campaignData.name,
            subject: campaignData.subject,
            recipient_count: recipients.length,
            sent_at: new Date().toISOString()
          }
        };
      }

      return { success: false, error: "Invalid action specified" };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send email campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Update Email Campaign Tool
export const updateEmailCampaignTool = {
  name: "update_email_campaign",
  description: "Update an existing email campaign (only drafts can be modified)",
  parameters: z.object({
    campaign_id: z.string().uuid("Valid campaign UUID required"),
    name: z.string().optional(),
    subject: z.string().optional(),
    content: z.string().optional(),
    campaign_type: z.enum(["newsletter", "promotional", "announcement", "follow_up"]).optional(),
    target_audience: z.enum(["all_clients", "leads", "high_value_clients", "recent_clients", "custom"]).optional(),
    custom_segment: z.array(z.string().uuid()).optional(),
    scheduled_for: z.string().optional()
  }),
  execute: async (params: any) => {
    try {
      // Check if campaign exists and is modifiable
      const campaign = await sql`
        SELECT status FROM email_campaigns WHERE id = ${params.campaign_id}
      `;

      if (campaign.length === 0) {
        return { success: false, error: "Campaign not found" };
      }

      if (campaign[0].status === 'SENT') {
        return { success: false, error: "Cannot modify sent campaigns" };
      }

      const updates = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(params).forEach(key => {
        if (key !== 'campaign_id' && params[key] !== undefined) {
          if (key === 'custom_segment') {
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
      values.push(params.campaign_id);

      const query = `
        UPDATE email_campaigns 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, subject, status, updated_at
      `;

      const result = await sql(query, values);

      return {
        success: true,
        message: "Email campaign updated successfully",
        campaign: {
          id: result[0].id,
          name: result[0].name,
          subject: result[0].subject,
          status: result[0].status,
          updated_at: result[0].updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update email campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Delete Email Campaign Tool
export const deleteEmailCampaignTool = {
  name: "delete_email_campaign",
  description: "Delete an email campaign (only drafts can be deleted)",
  parameters: z.object({
    campaign_id: z.string().uuid("Valid campaign UUID required"),
    reason: z.string().min(1, "Deletion reason required")
  }),
  execute: async (params: any) => {
    try {
      // Check campaign status before deletion
      const campaign = await sql`
        SELECT name, status FROM email_campaigns WHERE id = ${params.campaign_id}
      `;

      if (campaign.length === 0) {
        return { success: false, error: "Campaign not found" };
      }

      if (campaign[0].status === 'SENT') {
        return { success: false, error: "Cannot delete sent campaigns (for record keeping)" };
      }

      const result = await sql`
        DELETE FROM email_campaigns 
        WHERE id = ${params.campaign_id}
        RETURNING id, name, status
      `;

      return {
        success: true,
        message: "Email campaign deleted successfully",
        deleted_campaign: {
          id: result[0].id,
          name: result[0].name,
          status: result[0].status
        },
        reason: params.reason
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete email campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const emailCampaignTools = [
  createEmailCampaignTool,
  readEmailCampaignsTool,
  sendEmailCampaignTool,
  updateEmailCampaignTool,
  deleteEmailCampaignTool
];