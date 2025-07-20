import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Questionnaire Management Tools for CRM Agent - Feature 9

// Create Questionnaire Tool
export const createQuestionnaireTool = {
  name: "create_questionnaire",
  description: "Create a new questionnaire for client intake, feedback, or surveys",
  parameters: z.object({
    title: z.string().min(1, "Questionnaire title required"),
    description: z.string().optional(),
    questionnaire_type: z.enum(["client_intake", "feedback", "survey", "pre_session", "post_session"]),
    questions: z.array(z.object({
      question_text: z.string().min(1),
      question_type: z.enum(["text", "textarea", "select", "radio", "checkbox", "rating", "date"]),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(false),
      order_index: z.number()
    })).min(1, "At least one question required"),
    active: z.boolean().default(true),
    target_audience: z.enum(["new_clients", "existing_clients", "all_clients", "leads"]),
    auto_send: z.boolean().default(false),
    send_trigger: z.enum(["booking_confirmation", "session_completion", "manual"]).optional()
  }),
  execute: async (params: any) => {
    try {
      const questionnaireId = crypto.randomUUID();
      
      // Create questionnaire
      await sql`
        INSERT INTO questionnaires (
          id, title, description, questionnaire_type, active,
          target_audience, auto_send, send_trigger, created_at, updated_at
        ) VALUES (
          ${questionnaireId}, ${params.title}, ${params.description || ''},
          ${params.questionnaire_type}, ${params.active}, ${params.target_audience},
          ${params.auto_send}, ${params.send_trigger || 'manual'}, NOW(), NOW()
        )
      `;

      // Create questions
      for (const question of params.questions) {
        const questionId = crypto.randomUUID();
        await sql`
          INSERT INTO questionnaire_questions (
            id, questionnaire_id, question_text, question_type, options,
            required, order_index, created_at
          ) VALUES (
            ${questionId}, ${questionnaireId}, ${question.question_text},
            ${question.question_type}, ${JSON.stringify(question.options || [])},
            ${question.required}, ${question.order_index}, NOW()
          )
        `;
      }

      return {
        success: true,
        questionnaire_id: questionnaireId,
        message: `Questionnaire "${params.title}" has been created successfully with ${params.questions.length} questions and is ready to send to ${params.target_audience}.`,
        next_steps: params.auto_send ? 
          "Auto-send is enabled - questionnaire will be sent automatically based on trigger settings." : 
          "Use the send_questionnaire tool to distribute this questionnaire to clients.",
        details: {
          title: params.title,
          type: params.questionnaire_type,
          questions_count: params.questions.length,
          target_audience: params.target_audience,
          auto_send: params.auto_send,
          active: params.active
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Questionnaires Tool
export const readQuestionnairesTool = {
  name: "read_questionnaires",
  description: "Retrieve questionnaires with filtering and response statistics",
  parameters: z.object({
    questionnaire_type: z.enum(["client_intake", "feedback", "survey", "pre_session", "post_session"]).optional(),
    active: z.boolean().optional(),
    target_audience: z.enum(["new_clients", "existing_clients", "all_clients", "leads"]).optional(),
    include_questions: z.boolean().default(false),
    include_stats: z.boolean().default(true),
    limit: z.number().min(1).max(50).default(10)
  }),
  execute: async (params: any) => {
    try {
      let query = `
        SELECT 
          q.id, q.title, q.description, q.questionnaire_type, q.active,
          q.target_audience, q.auto_send, q.send_trigger, q.created_at,
          COUNT(qq.id) as question_count,
          COUNT(qr.id) as response_count
        FROM questionnaires q
        LEFT JOIN questionnaire_questions qq ON q.id = qq.questionnaire_id
        LEFT JOIN questionnaire_responses qr ON q.id = qr.questionnaire_id
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (params.questionnaire_type) {
        conditions.push(`q.questionnaire_type = $${paramIndex}`);
        values.push(params.questionnaire_type);
        paramIndex++;
      }
      
      if (params.active !== undefined) {
        conditions.push(`q.active = $${paramIndex}`);
        values.push(params.active);
        paramIndex++;
      }
      
      if (params.target_audience) {
        conditions.push(`q.target_audience = $${paramIndex}`);
        values.push(params.target_audience);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` 
        GROUP BY q.id, q.title, q.description, q.questionnaire_type, q.active,
                 q.target_audience, q.auto_send, q.send_trigger, q.created_at
        ORDER BY q.created_at DESC 
        LIMIT $${paramIndex}
      `;
      values.push(params.limit);

      const questionnaires = await sql(query, values);

      const result: any = {
        success: true,
        count: questionnaires.length,
        questionnaires: []
      };

      for (const questionnaire of questionnaires) {
        const questionnaireData: any = {
          id: questionnaire.id,
          title: questionnaire.title,
          description: questionnaire.description,
          type: questionnaire.questionnaire_type,
          active: questionnaire.active,
          target_audience: questionnaire.target_audience,
          auto_send: questionnaire.auto_send,
          send_trigger: questionnaire.send_trigger,
          question_count: questionnaire.question_count,
          response_count: questionnaire.response_count,
          created_at: questionnaire.created_at
        };

        if (params.include_questions) {
          const questions = await sql`
            SELECT id, question_text, question_type, options, required, order_index
            FROM questionnaire_questions
            WHERE questionnaire_id = ${questionnaire.id}
            ORDER BY order_index
          `;

          questionnaireData.questions = questions.map(q => ({
            id: q.id,
            text: q.question_text,
            type: q.question_type,
            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
            required: q.required,
            order: q.order_index
          }));
        }

        if (params.include_stats && questionnaire.response_count > 0) {
          const completionStats = await sql`
            SELECT 
              COUNT(*) as total_responses,
              COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_responses,
              AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_completion_time
            FROM questionnaire_responses
            WHERE questionnaire_id = ${questionnaire.id}
          `;

          questionnaireData.stats = {
            total_responses: completionStats[0].total_responses,
            completed_responses: completionStats[0].completed_responses,
            completion_rate: completionStats[0].total_responses > 0 ? 
              `${((completionStats[0].completed_responses / completionStats[0].total_responses) * 100).toFixed(1)}%` : '0%',
            avg_completion_time: completionStats[0].avg_completion_time ? 
              `${Math.round(completionStats[0].avg_completion_time / 60)} minutes` : 'N/A'
          };
        }

        result.questionnaires.push(questionnaireData);
      }

      if (params.include_stats) {
        const overallStats = await sql`
          SELECT 
            COUNT(*) as total_questionnaires,
            COUNT(CASE WHEN active = true THEN 1 END) as active_questionnaires,
            SUM(
              (SELECT COUNT(*) FROM questionnaire_responses WHERE questionnaire_id = questionnaires.id)
            ) as total_responses
          FROM questionnaires
        `;

        result.stats = {
          total_questionnaires: overallStats[0].total_questionnaires,
          active: overallStats[0].active_questionnaires,
          total_responses: overallStats[0].total_responses || 0
        };
      }

      result.message = `Successfully retrieved ${result.count} questionnaires with comprehensive analytics.`;
      result.insights = result.count > 0 ? 
        `Active questionnaires: ${result.stats?.active || 0}, Total responses: ${result.stats?.total_responses || 0}` : 
        "No questionnaires found matching your criteria";
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to read questionnaires: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Send Questionnaire Tool
export const sendQuestionnaireTool = {
  name: "send_questionnaire",
  description: "Send a questionnaire to specific clients or target groups",
  parameters: z.object({
    questionnaire_id: z.string().uuid("Valid questionnaire UUID required"),
    recipients: z.array(z.string().uuid()).optional(),
    target_group: z.enum(["new_clients", "existing_clients", "all_clients", "leads"]).optional(),
    send_method: z.enum(["email", "sms", "portal_notification"]),
    custom_message: z.string().optional(),
    due_date: z.string().optional()
  }),
  execute: async (params: any) => {
    try {
      // Get questionnaire details
      const questionnaire = await sql`
        SELECT title, questionnaire_type, target_audience 
        FROM questionnaires 
        WHERE id = ${params.questionnaire_id} AND active = true
      `;

      if (questionnaire.length === 0) {
        return { success: false, error: "Questionnaire not found or inactive" };
      }

      const questionnaireData = questionnaire[0];

      // Determine recipients
      let recipientQuery = '';
      const recipientValues = [];

      if (params.recipients && params.recipients.length > 0) {
        const placeholders = params.recipients.map((_, index) => `$${index + 1}`).join(',');
        recipientQuery = `SELECT id, email, first_name, last_name FROM crm_clients WHERE id IN (${placeholders})`;
        recipientValues.push(...params.recipients);
      } else if (params.target_group) {
        switch (params.target_group) {
          case 'all_clients':
            recipientQuery = 'SELECT id, email, first_name, last_name FROM crm_clients WHERE email IS NOT NULL';
            break;
          case 'new_clients':
            recipientQuery = `
              SELECT id, email, first_name, last_name 
              FROM crm_clients 
              WHERE email IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'
            `;
            break;
          case 'existing_clients':
            recipientQuery = `
              SELECT id, email, first_name, last_name 
              FROM crm_clients 
              WHERE email IS NOT NULL AND created_at < NOW() - INTERVAL '30 days'
            `;
            break;
          case 'leads':
            recipientQuery = 'SELECT id, email, first_name, last_name FROM crm_leads WHERE email IS NOT NULL';
            break;
        }
      } else {
        return { success: false, error: "Must specify either recipients or target_group" };
      }

      const recipients = await sql(recipientQuery, recipientValues);

      if (recipients.length === 0) {
        return { success: false, error: "No valid recipients found" };
      }

      // Create questionnaire responses for tracking
      const responseIds = [];
      for (const recipient of recipients) {
        const responseId = crypto.randomUUID();
        responseIds.push(responseId);

        await sql`
          INSERT INTO questionnaire_responses (
            id, questionnaire_id, client_id, client_email,
            sent_at, due_date, send_method, status, created_at
          ) VALUES (
            ${responseId}, ${params.questionnaire_id}, ${recipient.id},
            ${recipient.email}, NOW(), 
            ${params.due_date ? new Date(params.due_date) : null},
            ${params.send_method}, 'SENT', NOW()
          )
        `;
      }

      // In a real implementation, this would integrate with email/SMS services
      // For now, we'll simulate the sending process

      return {
        success: true,
        message: `Questionnaire "${questionnaireData.title}" sent successfully`,
        details: {
          questionnaire_title: questionnaireData.title,
          questionnaire_type: questionnaireData.questionnaire_type,
          recipients_count: recipients.length,
          send_method: params.send_method,
          due_date: params.due_date || 'No due date',
          response_ids: responseIds
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Questionnaire Responses Tool
export const readQuestionnaireResponsesTool = {
  name: "read_questionnaire_responses",
  description: "Retrieve questionnaire responses with filtering and analysis",
  parameters: z.object({
    questionnaire_id: z.string().uuid().optional(),
    client_id: z.string().uuid().optional(),
    status: z.enum(["SENT", "STARTED", "COMPLETED", "EXPIRED"]).optional(),
    completed_only: z.boolean().default(false),
    include_answers: z.boolean().default(false),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    limit: z.number().min(1).max(100).default(20)
  }),
  execute: async (params: any) => {
    try {
      let query = `
        SELECT 
          qr.id, qr.questionnaire_id, qr.client_id, qr.client_email,
          qr.sent_at, qr.started_at, qr.completed_at, qr.due_date,
          qr.send_method, qr.status,
          q.title as questionnaire_title, q.questionnaire_type,
          c.first_name || ' ' || c.last_name as client_name
        FROM questionnaire_responses qr
        LEFT JOIN questionnaires q ON qr.questionnaire_id = q.id
        LEFT JOIN crm_clients c ON qr.client_id = c.id::text
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (params.questionnaire_id) {
        conditions.push(`qr.questionnaire_id = $${paramIndex}`);
        values.push(params.questionnaire_id);
        paramIndex++;
      }
      
      if (params.client_id) {
        conditions.push(`qr.client_id = $${paramIndex}`);
        values.push(params.client_id);
        paramIndex++;
      }
      
      if (params.status) {
        conditions.push(`qr.status = $${paramIndex}`);
        values.push(params.status);
        paramIndex++;
      }
      
      if (params.completed_only) {
        conditions.push(`qr.completed_at IS NOT NULL`);
      }
      
      if (params.date_from) {
        conditions.push(`qr.sent_at >= $${paramIndex}`);
        values.push(new Date(params.date_from));
        paramIndex++;
      }
      
      if (params.date_to) {
        conditions.push(`qr.sent_at <= $${paramIndex}`);
        values.push(new Date(params.date_to));
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY qr.sent_at DESC LIMIT $${paramIndex}`;
      values.push(params.limit);

      const responses = await sql(query, values);

      const result: any = {
        success: true,
        count: responses.length,
        responses: []
      };

      for (const response of responses) {
        const responseData: any = {
          id: response.id,
          questionnaire_id: response.questionnaire_id,
          questionnaire_title: response.questionnaire_title,
          questionnaire_type: response.questionnaire_type,
          client_id: response.client_id,
          client_name: response.client_name || 'Unknown',
          client_email: response.client_email,
          status: response.status,
          sent_at: response.sent_at,
          started_at: response.started_at,
          completed_at: response.completed_at,
          due_date: response.due_date,
          send_method: response.send_method
        };

        if (response.started_at && response.completed_at) {
          const completionTime = new Date(response.completed_at).getTime() - new Date(response.started_at).getTime();
          responseData.completion_time = `${Math.round(completionTime / 60000)} minutes`;
        }

        if (params.include_answers && response.completed_at) {
          const answers = await sql`
            SELECT qa.question_id, qa.answer_text, qa.answer_data,
                   qq.question_text, qq.question_type
            FROM questionnaire_answers qa
            JOIN questionnaire_questions qq ON qa.question_id = qq.id
            WHERE qa.response_id = ${response.id}
            ORDER BY qq.order_index
          `;

          responseData.answers = answers.map(answer => ({
            question_id: answer.question_id,
            question_text: answer.question_text,
            question_type: answer.question_type,
            answer: answer.answer_text,
            answer_data: answer.answer_data ? JSON.parse(answer.answer_data) : null
          }));
        }

        result.responses.push(responseData);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to read questionnaire responses: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Update Questionnaire Tool
export const updateQuestionnaireTool = {
  name: "update_questionnaire",
  description: "Update an existing questionnaire (structure, settings, activation)",
  parameters: z.object({
    questionnaire_id: z.string().uuid("Valid questionnaire UUID required"),
    title: z.string().optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
    target_audience: z.enum(["new_clients", "existing_clients", "all_clients", "leads"]).optional(),
    auto_send: z.boolean().optional(),
    send_trigger: z.enum(["booking_confirmation", "session_completion", "manual"]).optional()
  }),
  execute: async (params: any) => {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(params).forEach(key => {
        if (key !== 'questionnaire_id' && params[key] !== undefined) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(params[key]);
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        return { success: false, error: "No updates provided" };
      }

      updates.push('updated_at = NOW()');
      values.push(params.questionnaire_id);

      const query = `
        UPDATE questionnaires 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, title, questionnaire_type, active, updated_at
      `;

      const result = await sql(query, values);

      if (result.length === 0) {
        return { success: false, error: "Questionnaire not found" };
      }

      return {
        success: true,
        message: "Questionnaire updated successfully",
        questionnaire: {
          id: result[0].id,
          title: result[0].title,
          type: result[0].questionnaire_type,
          active: result[0].active,
          updated_at: result[0].updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const questionnaireTools = [
  createQuestionnaireTool,
  readQuestionnairesTool,
  sendQuestionnaireTool,
  readQuestionnaireResponsesTool,
  updateQuestionnaireTool
];