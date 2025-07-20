import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Calendar Management Tools for CRM Agent - Feature 5

// Create Photography Session Tool
export const createSessionTool = {
  name: "create_photography_session",
  description: "Create a new photography session/booking in the calendar",
  parameters: z.object({
    client_id: z.string().uuid("Valid client UUID required"),
    session_type: z.enum([
      "FAMILY", "NEWBORN", "MATERNITY", "BUSINESS", "WEDDING", 
      "EVENT", "PORTRAIT", "HEADSHOT", "COUPLE", "ENGAGEMENT"
    ]),
    session_date: z.string().describe("Session date in YYYY-MM-DD format"),
    session_time: z.string().describe("Session time in HH:MM format"),
    duration_minutes: z.number().min(30).max(480).default(120),
    location: z.string().min(1, "Location is required"),
    notes: z.string().optional(),
    price: z.number().min(0).optional(),
    deposit_required: z.number().min(0).optional(),
    equipment_needed: z.array(z.string()).optional()
  }),
  execute: async (params: any) => {
    try {
      const sessionId = crypto.randomUUID();
      const sessionDateTime = `${params.session_date} ${params.session_time}:00`;
      
      await sql`
        INSERT INTO photography_sessions (
          id, client_id, session_type, start_time, end_time,
          location_name, notes, base_price, deposit_amount, equipment_list,
          status, created_at, updated_at
        ) VALUES (
          ${sessionId}, ${params.client_id}, ${params.session_type},
          ${sessionDateTime}::timestamp, 
          (${sessionDateTime}::timestamp + INTERVAL '${params.duration_minutes} minutes'),
          ${params.location}, ${params.notes || ''}, ${params.price || 0}, 
          ${params.deposit_required || 0}, ${JSON.stringify(params.equipment_needed || [])}, 
          'CONFIRMED', NOW(), NOW()
        )
      `;

      return {
        success: true,
        session_id: sessionId,
        message: `Photography session created successfully for ${params.session_date} at ${params.session_time}`,
        details: {
          type: params.session_type,
          duration: `${params.duration_minutes} minutes`,
          location: params.location
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Read Calendar Sessions Tool
export const readCalendarTool = {
  name: "read_calendar_sessions",
  description: "Retrieve photography sessions from calendar with filtering options",
  parameters: z.object({
    start_date: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
    end_date: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
    client_id: z.string().uuid().optional().describe("Filter by specific client"),
    session_type: z.enum([
      "FAMILY", "NEWBORN", "MATERNITY", "BUSINESS", "WEDDING", 
      "EVENT", "PORTRAIT", "HEADSHOT", "COUPLE", "ENGAGEMENT"
    ]).optional(),
    status: z.enum(["CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"]).optional(),
    limit: z.number().min(1).max(100).default(20)
  }),
  execute: async (params: any) => {
    try {
      console.log('📅 read_calendar_sessions: Fetching photography sessions');
      
      // Use correct column names from actual database schema
      let query = `
        SELECT 
          ps.id,
          ps.session_type,
          ps.start_time,
          ps.end_time,
          ps.location_name,
          ps.notes,
          ps.base_price,
          ps.deposit_amount,
          ps.equipment_list,
          ps.status,
          ps.created_at,
          c.first_name || ' ' || c.last_name as client_name,
          c.email as client_email,
          c.phone as client_phone,
          EXTRACT(EPOCH FROM (ps.end_time - ps.start_time))/60 as duration_minutes
        FROM photography_sessions ps
        LEFT JOIN crm_clients c ON ps.client_id = c.id
      `;

      const conditions = [];
      if (params.start_date) conditions.push(`DATE(ps.start_time) >= '${params.start_date}'`);
      if (params.end_date) conditions.push(`DATE(ps.start_time) <= '${params.end_date}'`);
      if (params.client_id) conditions.push(`ps.client_id = '${params.client_id}'`);
      if (params.session_type) conditions.push(`ps.session_type = '${params.session_type}'`);
      if (params.status) conditions.push(`ps.status = '${params.status}'`);

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY ps.start_time ASC LIMIT ${params.limit}`;

      const sessions = await sql.unsafe(query);
      console.log(`✅ read_calendar_sessions: Found ${sessions.length} sessions`);

      return {
        success: true,
        count: sessions.length,
        summary: `Found ${sessions.length} photography sessions${params.session_type ? ` (${params.session_type})` : ''}${params.start_date ? ` from ${params.start_date}` : ''}`,
        sessions: sessions.map((session, index) => ({
          id: session.id,
          client_name: session.client_name || 'Unknown Client',
          client_email: session.client_email,
          session_type: session.session_type,
          start_time: session.start_time,
          end_time: session.end_time,
          duration: `${Math.round(session.duration_minutes || 0)} minutes`,
          location: session.location_name,
          price: session.base_price ? `€${session.base_price}` : 'Not set',
          deposit: session.deposit_amount ? `€${session.deposit_amount}` : 'None',
          status: session.status,
          notes: session.notes || 'No notes',
          booking_number: `#${String(index + 1).padStart(3, '0')}`
        })),
        next_available: sessions.length === params.limit ? 'More sessions available' : 'All sessions loaded'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read calendar: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Update Session Tool
export const updateSessionTool = {
  name: "update_photography_session",
  description: "Update an existing photography session (reschedule, change details, update status)",
  parameters: z.object({
    session_id: z.string().uuid("Valid session UUID required"),
    session_date: z.string().optional().describe("New session date (YYYY-MM-DD)"),
    session_time: z.string().optional().describe("New session time (HH:MM)"),
    duration_minutes: z.number().min(30).max(480).optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    price: z.number().min(0).optional(),
    status: z.enum(["CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"]).optional(),
    cancellation_reason: z.string().optional()
  }),
  execute: async (params: any) => {
    try {
      const updates = [];
      const values = [];

      if (params.session_date && params.session_time) {
        updates.push('session_date = $' + (values.length + 1));
        values.push(`${params.session_date} ${params.session_time}:00`);
      }
      if (params.duration_minutes) {
        updates.push('duration_minutes = $' + (values.length + 1));
        values.push(params.duration_minutes);
      }
      if (params.location) {
        updates.push('location = $' + (values.length + 1));
        values.push(params.location);
      }
      if (params.notes) {
        updates.push('notes = $' + (values.length + 1));
        values.push(params.notes);
      }
      if (params.price !== undefined) {
        updates.push('price = $' + (values.length + 1));
        values.push(params.price);
      }
      if (params.status) {
        updates.push('status = $' + (values.length + 1));
        values.push(params.status);
      }
      if (params.cancellation_reason) {
        updates.push('cancellation_reason = $' + (values.length + 1));
        values.push(params.cancellation_reason);
      }

      if (updates.length === 0) {
        return { success: false, error: "No updates provided" };
      }

      updates.push('updated_at = NOW()');
      values.push(params.session_id);

      const query = `
        UPDATE photography_sessions 
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
        RETURNING id, session_type, session_date, status
      `;

      const result = await sql(query, values);

      if (result.length === 0) {
        return { success: false, error: "Session not found" };
      }

      return {
        success: true,
        message: "Session updated successfully",
        session: {
          id: result[0].id,
          type: result[0].session_type,
          date: result[0].session_date,
          status: result[0].status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Delete/Cancel Session Tool
export const cancelSessionTool = {
  name: "cancel_photography_session",
  description: "Cancel or delete a photography session",
  parameters: z.object({
    session_id: z.string().uuid("Valid session UUID required"),
    cancellation_reason: z.string().min(1, "Cancellation reason required"),
    refund_amount: z.number().min(0).optional(),
    notify_client: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      const result = await sql`
        UPDATE photography_sessions 
        SET 
          status = 'CANCELLED',
          cancellation_reason = ${params.cancellation_reason},
          refund_amount = ${params.refund_amount || 0},
          updated_at = NOW()
        WHERE id = ${params.session_id}
        RETURNING id, session_type, session_date, client_id
      `;

      if (result.length === 0) {
        return { success: false, error: "Session not found" };
      }

      return {
        success: true,
        message: "Session cancelled successfully",
        session: {
          id: result[0].id,
          type: result[0].session_type,
          date: result[0].session_date,
          status: 'CANCELLED'
        },
        next_steps: params.notify_client ? 
          "Client notification recommended - use email tool to inform client of cancellation" : 
          "Session cancelled without client notification"
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cancel session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Check Calendar Availability Tool
export const checkAvailabilityTool = {
  name: "check_calendar_availability",
  description: "Check available time slots for booking new sessions",
  parameters: z.object({
    date: z.string().describe("Date to check availability (YYYY-MM-DD)"),
    duration_minutes: z.number().min(30).max(480).default(120),
    preferred_times: z.array(z.string()).optional().describe("Preferred time slots (HH:MM format)")
  }),
  execute: async (params: any) => {
    try {
      // Get existing sessions for the date
      const existingSessions = await sql`
        SELECT session_date, duration_minutes
        FROM photography_sessions
        WHERE DATE(session_date) = ${params.date}
        AND status IN ('CONFIRMED', 'PENDING')
        ORDER BY session_date
      `;

      // Define working hours (9 AM to 6 PM)
      const workingHours = {
        start: 9,
        end: 18
      };

      const availableSlots = [];
      const bookedSlots = existingSessions.map(session => {
        const sessionDate = new Date(session.session_date);
        return {
          start: sessionDate.getHours() + (sessionDate.getMinutes() / 60),
          end: sessionDate.getHours() + (sessionDate.getMinutes() / 60) + (session.duration_minutes / 60)
        };
      });

      // Check each hour slot
      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        const slotEnd = hour + (params.duration_minutes / 60);
        
        if (slotEnd <= workingHours.end) {
          const isAvailable = !bookedSlots.some(booked => 
            (hour < booked.end && slotEnd > booked.start)
          );

          if (isAvailable) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            availableSlots.push({
              time: timeSlot,
              duration: `${params.duration_minutes} minutes`,
              preferred: params.preferred_times?.includes(timeSlot) || false
            });
          }
        }
      }

      return {
        success: true,
        date: params.date,
        total_available_slots: availableSlots.length,
        available_slots: availableSlots,
        booked_sessions: existingSessions.length,
        recommendations: availableSlots.filter(slot => slot.preferred)
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const calendarTools = [
  createSessionTool,
  readCalendarTool,
  updateSessionTool,
  cancelSessionTool,
  checkAvailabilityTool
];