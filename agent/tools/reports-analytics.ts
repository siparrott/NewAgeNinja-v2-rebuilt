import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Reports & Analytics Tools for CRM Agent - Feature 10

// Generate Business Report Tool
export const generateBusinessReportTool = {
  name: "generate_business_report",
  description: "Generate comprehensive business reports with revenue, client, and performance analytics",
  parameters: z.object({
    report_type: z.enum(["revenue", "client_activity", "session_performance", "marketing", "comprehensive"]),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).default("monthly"),
    include_charts: z.boolean().default(true),
    export_format: z.enum(["json", "summary"]).default("summary")
  }),
  execute: async (params: any) => {
    try {
      const dateFrom = params.date_from ? new Date(params.date_from) : new Date(new Date().setDate(new Date().getDate() - 30));
      const dateTo = params.date_to ? new Date(params.date_to) : new Date();

      const report: any = {
        success: true,
        report_type: params.report_type,
        period: params.period,
        date_range: {
          from: dateFrom.toISOString().split('T')[0],
          to: dateTo.toISOString().split('T')[0]
        },
        generated_at: new Date().toISOString()
      };

      if (params.report_type === 'revenue' || params.report_type === 'comprehensive') {
        // Revenue Analytics
        const revenueData = await sql`
          SELECT 
            COUNT(*) as total_invoices,
            COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_invoices,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_invoices,
            COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END) as overdue_invoices,
            SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN status = 'PENDING' THEN total_amount ELSE 0 END) as pending_revenue,
            AVG(CASE WHEN status = 'PAID' THEN total_amount END) as avg_invoice_value
          FROM crm_invoices
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
        `;

        const monthlyRevenue = await sql`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END) as revenue,
            COUNT(*) as invoice_count
          FROM crm_invoices
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month
        `;

        report.revenue = {
          summary: {
            total_invoices: revenueData[0].total_invoices,
            paid_invoices: revenueData[0].paid_invoices,
            pending_invoices: revenueData[0].pending_invoices,
            overdue_invoices: revenueData[0].overdue_invoices,
            total_revenue: `€${parseFloat(revenueData[0].total_revenue || 0).toFixed(2)}`,
            pending_revenue: `€${parseFloat(revenueData[0].pending_revenue || 0).toFixed(2)}`,
            avg_invoice_value: `€${parseFloat(revenueData[0].avg_invoice_value || 0).toFixed(2)}`,
            payment_rate: revenueData[0].total_invoices > 0 ? 
              `${((revenueData[0].paid_invoices / revenueData[0].total_invoices) * 100).toFixed(1)}%` : '0%'
          },
          monthly_breakdown: monthlyRevenue.map(row => ({
            month: row.month.toISOString().split('T')[0],
            revenue: `€${parseFloat(row.revenue).toFixed(2)}`,
            invoice_count: row.invoice_count
          }))
        };
      }

      if (params.report_type === 'client_activity' || params.report_type === 'comprehensive') {
        // Client Activity Analytics
        const clientData = await sql`
          SELECT 
            COUNT(*) as total_clients,
            COUNT(CASE WHEN created_at BETWEEN ${dateFrom} AND ${dateTo} THEN 1 END) as new_clients,
            COUNT(DISTINCT CASE WHEN i.client_id IS NOT NULL THEN c.id END) as active_clients
          FROM crm_clients c
          LEFT JOIN crm_invoices i ON c.id::text = i.client_id AND i.created_at BETWEEN ${dateFrom} AND ${dateTo}
        `;

        const topClients = await sql`
          SELECT 
            c.first_name || ' ' || c.last_name as client_name,
            c.email,
            COUNT(i.id) as invoice_count,
            SUM(CASE WHEN i.status = 'PAID' THEN i.total_amount ELSE 0 END) as total_revenue
          FROM crm_clients c
          JOIN crm_invoices i ON c.id::text = i.client_id
          WHERE i.created_at BETWEEN ${dateFrom} AND ${dateTo}
          GROUP BY c.id, c.first_name, c.last_name, c.email
          HAVING SUM(CASE WHEN i.status = 'PAID' THEN i.total_amount ELSE 0 END) > 0
          ORDER BY total_revenue DESC
          LIMIT 10
        `;

        report.clients = {
          summary: {
            total_clients: clientData[0].total_clients,
            new_clients: clientData[0].new_clients,
            active_clients: clientData[0].active_clients,
            client_retention_rate: clientData[0].total_clients > 0 ? 
              `${((clientData[0].active_clients / clientData[0].total_clients) * 100).toFixed(1)}%` : '0%'
          },
          top_clients: topClients.map(client => ({
            name: client.client_name,
            email: client.email,
            invoices: client.invoice_count,
            revenue: `€${parseFloat(client.total_revenue).toFixed(2)}`
          }))
        };
      }

      if (params.report_type === 'session_performance' || params.report_type === 'comprehensive') {
        // Session Performance Analytics
        const sessionData = await sql`
          SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_sessions,
            COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled_sessions,
            COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_sessions,
            session_type,
            COUNT(*) as type_count
          FROM photography_sessions
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          GROUP BY session_type
          ORDER BY type_count DESC
        `;

        const sessionsByType = await sql`
          SELECT 
            session_type,
            COUNT(*) as session_count,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count
          FROM photography_sessions
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          GROUP BY session_type
          ORDER BY session_count DESC
        `;

        const totalSessions = sessionData.reduce((sum, row) => sum + parseInt(row.total_sessions), 0);
        const completedSessions = sessionData.reduce((sum, row) => sum + parseInt(row.completed_sessions), 0);

        report.sessions = {
          summary: {
            total_sessions: totalSessions,
            completed_sessions: completedSessions,
            completion_rate: totalSessions > 0 ? 
              `${((completedSessions / totalSessions) * 100).toFixed(1)}%` : '0%'
          },
          by_type: sessionsByType.map(type => ({
            type: type.session_type,
            total: type.session_count,
            completed: type.completed_count,
            completion_rate: type.session_count > 0 ? 
              `${((type.completed_count / type.session_count) * 100).toFixed(1)}%` : '0%'
          }))
        };
      }

      if (params.report_type === 'marketing' || params.report_type === 'comprehensive') {
        // Marketing Analytics
        const leadData = await sql`
          SELECT 
            COUNT(*) as total_leads,
            COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_leads,
            COUNT(CASE WHEN status = 'CONTACTED' THEN 1 END) as contacted_leads,
            COUNT(CASE WHEN status = 'QUALIFIED' THEN 1 END) as qualified_leads,
            COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted_leads
          FROM crm_leads
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
        `;

        const leadSources = await sql`
          SELECT 
            source,
            COUNT(*) as lead_count,
            COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted_count
          FROM crm_leads
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          GROUP BY source
          ORDER BY lead_count DESC
        `;

        report.marketing = {
          summary: {
            total_leads: leadData[0].total_leads,
            new_leads: leadData[0].new_leads,
            conversion_rate: leadData[0].total_leads > 0 ? 
              `${((leadData[0].converted_leads / leadData[0].total_leads) * 100).toFixed(1)}%` : '0%'
          },
          lead_sources: leadSources.map(source => ({
            source: source.source || 'Unknown',
            leads: source.lead_count,
            conversions: source.converted_count,
            conversion_rate: source.lead_count > 0 ? 
              `${((source.converted_count / source.lead_count) * 100).toFixed(1)}%` : '0%'
          }))
        };
      }

      return report;
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate business report: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Get KPI Dashboard Tool
export const getKPIDashboardTool = {
  name: "get_kpi_dashboard",
  description: "Retrieve key performance indicators and dashboard metrics",
  parameters: z.object({
    timeframe: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
    include_trends: z.boolean().default(true),
    include_comparisons: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      let dateFrom: Date;
      let compareDateFrom: Date;
      const dateTo = new Date();

      switch (params.timeframe) {
        case 'today':
          dateFrom = new Date();
          dateFrom.setHours(0, 0, 0, 0);
          compareDateFrom = new Date(dateFrom);
          compareDateFrom.setDate(compareDateFrom.getDate() - 1);
          break;
        case 'week':
          dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 7);
          compareDateFrom = new Date(dateFrom);
          compareDateFrom.setDate(compareDateFrom.getDate() - 7);
          break;
        case 'quarter':
          dateFrom = new Date();
          dateFrom.setMonth(dateFrom.getMonth() - 3);
          compareDateFrom = new Date(dateFrom);
          compareDateFrom.setMonth(compareDateFrom.getMonth() - 3);
          break;
        case 'year':
          dateFrom = new Date();
          dateFrom.setFullYear(dateFrom.getFullYear() - 1);
          compareDateFrom = new Date(dateFrom);
          compareDateFrom.setFullYear(compareDateFrom.getFullYear() - 1);
          break;
        default: // month
          dateFrom = new Date();
          dateFrom.setMonth(dateFrom.getMonth() - 1);
          compareDateFrom = new Date(dateFrom);
          compareDateFrom.setMonth(compareDateFrom.getMonth() - 1);
      }

      // Current period KPIs
      const currentKPIs = await sql`
        SELECT 
          -- Revenue KPIs
          (SELECT SUM(total_amount) FROM crm_invoices 
           WHERE status = 'PAID' AND created_at BETWEEN ${dateFrom} AND ${dateTo}) as revenue,
          (SELECT COUNT(*) FROM crm_invoices 
           WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}) as invoices_created,
          (SELECT COUNT(*) FROM crm_invoices 
           WHERE status = 'PAID' AND created_at BETWEEN ${dateFrom} AND ${dateTo}) as invoices_paid,
          
          -- Client KPIs
          (SELECT COUNT(*) FROM crm_clients 
           WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}) as new_clients,
          (SELECT COUNT(*) FROM crm_leads 
           WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}) as new_leads,
          (SELECT COUNT(*) FROM crm_leads 
           WHERE status = 'CONVERTED' AND updated_at BETWEEN ${dateFrom} AND ${dateTo}) as converted_leads,
          
          -- Session KPIs
          (SELECT COUNT(*) FROM photography_sessions 
           WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}) as sessions_booked,
          (SELECT COUNT(*) FROM photography_sessions 
           WHERE status = 'COMPLETED' AND updated_at BETWEEN ${dateFrom} AND ${dateTo}) as sessions_completed
      `;

      const kpis = currentKPIs[0];

      const dashboard: any = {
        success: true,
        timeframe: params.timeframe,
        period: {
          from: dateFrom.toISOString().split('T')[0],
          to: dateTo.toISOString().split('T')[0]
        },
        kpis: {
          revenue: {
            value: `€${parseFloat(kpis.revenue || 0).toFixed(2)}`,
            label: "Revenue"
          },
          invoices_paid: {
            value: kpis.invoices_paid || 0,
            label: "Invoices Paid"
          },
          payment_rate: {
            value: kpis.invoices_created > 0 ? 
              `${((kpis.invoices_paid / kpis.invoices_created) * 100).toFixed(1)}%` : '0%',
            label: "Payment Rate"
          },
          new_clients: {
            value: kpis.new_clients || 0,
            label: "New Clients"
          },
          conversion_rate: {
            value: kpis.new_leads > 0 ? 
              `${((kpis.converted_leads / kpis.new_leads) * 100).toFixed(1)}%` : '0%',
            label: "Lead Conversion Rate"
          },
          sessions_booked: {
            value: kpis.sessions_booked || 0,
            label: "Sessions Booked"
          },
          session_completion_rate: {
            value: kpis.sessions_booked > 0 ? 
              `${((kpis.sessions_completed / kpis.sessions_booked) * 100).toFixed(1)}%` : '0%',
            label: "Session Completion Rate"
          }
        }
      };

      if (params.include_comparisons) {
        // Previous period KPIs for comparison
        const compareKPIs = await sql`
          SELECT 
            (SELECT SUM(total_amount) FROM crm_invoices 
             WHERE status = 'PAID' AND created_at BETWEEN ${compareDateFrom} AND ${dateFrom}) as prev_revenue,
            (SELECT COUNT(*) FROM crm_clients 
             WHERE created_at BETWEEN ${compareDateFrom} AND ${dateFrom}) as prev_new_clients,
            (SELECT COUNT(*) FROM crm_leads 
             WHERE created_at BETWEEN ${compareDateFrom} AND ${dateFrom}) as prev_new_leads,
            (SELECT COUNT(*) FROM photography_sessions 
             WHERE created_at BETWEEN ${compareDateFrom} AND ${dateFrom}) as prev_sessions_booked
        `;

        const prevKPIs = compareKPIs[0];

        dashboard.comparisons = {
          revenue_change: prevKPIs.prev_revenue > 0 ? 
            `${(((kpis.revenue - prevKPIs.prev_revenue) / prevKPIs.prev_revenue) * 100).toFixed(1)}%` : 'N/A',
          clients_change: prevKPIs.prev_new_clients > 0 ? 
            `${(((kpis.new_clients - prevKPIs.prev_new_clients) / prevKPIs.prev_new_clients) * 100).toFixed(1)}%` : 'N/A',
          leads_change: prevKPIs.prev_new_leads > 0 ? 
            `${(((kpis.new_leads - prevKPIs.prev_new_leads) / prevKPIs.prev_new_leads) * 100).toFixed(1)}%` : 'N/A',
          sessions_change: prevKPIs.prev_sessions_booked > 0 ? 
            `${(((kpis.sessions_booked - prevKPIs.prev_sessions_booked) / prevKPIs.prev_sessions_booked) * 100).toFixed(1)}%` : 'N/A'
        };
      }

      return dashboard;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get KPI dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Export Data Analytics Tool
export const exportDataAnalyticsTool = {
  name: "export_data_analytics",
  description: "Export analytics data for external analysis or reporting",
  parameters: z.object({
    data_type: z.enum(["clients", "invoices", "sessions", "leads", "all"]),
    format: z.enum(["csv", "json", "summary"]),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    include_financial: z.boolean().default(true),
    include_personal: z.boolean().default(false)
  }),
  execute: async (params: any) => {
    try {
      const dateFrom = params.date_from ? new Date(params.date_from) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const dateTo = params.date_to ? new Date(params.date_to) : new Date();

      const exportData: any = {
        success: true,
        export_type: params.data_type,
        format: params.format,
        date_range: {
          from: dateFrom.toISOString().split('T')[0],
          to: dateTo.toISOString().split('T')[0]
        },
        exported_at: new Date().toISOString(),
        records: []
      };

      if (params.data_type === 'clients' || params.data_type === 'all') {
        const clientFields = params.include_personal ? 
          'id, first_name, last_name, email, phone, city, created_at' :
          'id, email, city, created_at';

        const clients = await sql`
          SELECT ${sql.unsafe(clientFields)}
          FROM crm_clients
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          ORDER BY created_at DESC
        `;

        exportData.clients = {
          count: clients.length,
          data: clients
        };
      }

      if (params.data_type === 'invoices' || params.data_type === 'all') {
        const invoiceFields = params.include_financial ? 
          'id, client_id, invoice_number, total_amount, tax_amount, status, created_at, due_date' :
          'id, client_id, invoice_number, status, created_at, due_date';

        const invoices = await sql`
          SELECT ${sql.unsafe(invoiceFields)}
          FROM crm_invoices
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          ORDER BY created_at DESC
        `;

        exportData.invoices = {
          count: invoices.length,
          data: invoices
        };
      }

      if (params.data_type === 'sessions' || params.data_type === 'all') {
        const sessions = await sql`
          SELECT id, client_id, session_type, session_date, duration, location, status, created_at
          FROM photography_sessions
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          ORDER BY session_date DESC
        `;

        exportData.sessions = {
          count: sessions.length,
          data: sessions
        };
      }

      if (params.data_type === 'leads' || params.data_type === 'all') {
        const leadFields = params.include_personal ? 
          'id, first_name, last_name, email, phone, source, status, created_at' :
          'id, email, source, status, created_at';

        const leads = await sql`
          SELECT ${sql.unsafe(leadFields)}
          FROM crm_leads
          WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
          ORDER BY created_at DESC
        `;

        exportData.leads = {
          count: leads.length,
          data: leads
        };
      }

      if (params.format === 'summary') {
        // Return summary statistics instead of raw data
        const summary: any = {
          success: true,
          export_summary: true,
          date_range: exportData.date_range,
          statistics: {}
        };

        if (exportData.clients) {
          summary.statistics.clients = {
            total_exported: exportData.clients.count,
            cities_represented: [...new Set(exportData.clients.data.map((c: any) => c.city).filter(Boolean))].length
          };
        }

        if (exportData.invoices) {
          const totalRevenue = exportData.invoices.data.reduce((sum: number, inv: any) => 
            sum + (inv.total_amount || 0), 0);
          summary.statistics.invoices = {
            total_exported: exportData.invoices.count,
            total_revenue: `€${totalRevenue.toFixed(2)}`,
            paid_count: exportData.invoices.data.filter((inv: any) => inv.status === 'PAID').length
          };
        }

        if (exportData.sessions) {
          summary.statistics.sessions = {
            total_exported: exportData.sessions.count,
            completed_sessions: exportData.sessions.data.filter((s: any) => s.status === 'COMPLETED').length,
            session_types: [...new Set(exportData.sessions.data.map((s: any) => s.session_type))].length
          };
        }

        if (exportData.leads) {
          summary.statistics.leads = {
            total_exported: exportData.leads.count,
            converted_leads: exportData.leads.data.filter((l: any) => l.status === 'CONVERTED').length,
            lead_sources: [...new Set(exportData.leads.data.map((l: any) => l.source))].length
          };
        }

        return summary;
      }

      return exportData;
    } catch (error) {
      return {
        success: false,
        error: `Failed to export data analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Get Performance Metrics Tool
export const getPerformanceMetricsTool = {
  name: "get_performance_metrics",
  description: "Get detailed performance metrics for business analysis",
  parameters: z.object({
    metric_type: z.enum(["financial", "operational", "marketing", "client_satisfaction"]),
    time_period: z.enum(["weekly", "monthly", "quarterly"]).default("monthly"),
    benchmark_comparison: z.boolean().default(false)
  }),
  execute: async (params: any) => {
    try {
      const metrics: any = {
        success: true,
        metric_type: params.metric_type,
        time_period: params.time_period,
        generated_at: new Date().toISOString()
      };

      const now = new Date();
      let periodStart: Date;

      switch (params.time_period) {
        case 'weekly':
          periodStart = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'quarterly':
          periodStart = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default: // monthly
          periodStart = new Date(now.setMonth(now.getMonth() - 1));
      }

      if (params.metric_type === 'financial') {
        const financialMetrics = await sql`
          SELECT 
            SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END) as revenue,
            COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_invoices,
            COUNT(*) as total_invoices,
            AVG(CASE WHEN status = 'PAID' THEN total_amount END) as avg_invoice_value,
            SUM(CASE WHEN status = 'PENDING' THEN total_amount ELSE 0 END) as outstanding_amount
          FROM crm_invoices
          WHERE created_at >= ${periodStart}
        `;

        metrics.financial = {
          revenue: `€${parseFloat(financialMetrics[0].revenue || 0).toFixed(2)}`,
          paid_invoices: financialMetrics[0].paid_invoices,
          total_invoices: financialMetrics[0].total_invoices,
          payment_rate: financialMetrics[0].total_invoices > 0 ? 
            `${((financialMetrics[0].paid_invoices / financialMetrics[0].total_invoices) * 100).toFixed(1)}%` : '0%',
          avg_invoice_value: `€${parseFloat(financialMetrics[0].avg_invoice_value || 0).toFixed(2)}`,
          outstanding_amount: `€${parseFloat(financialMetrics[0].outstanding_amount || 0).toFixed(2)}`
        };
      }

      if (params.metric_type === 'operational') {
        const operationalMetrics = await sql`
          SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_sessions,
            COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_sessions,
            AVG(duration) as avg_session_duration
          FROM photography_sessions
          WHERE created_at >= ${periodStart}
        `;

        metrics.operational = {
          total_sessions: operationalMetrics[0].total_sessions,
          completed_sessions: operationalMetrics[0].completed_sessions,
          cancelled_sessions: operationalMetrics[0].cancelled_sessions,
          completion_rate: operationalMetrics[0].total_sessions > 0 ? 
            `${((operationalMetrics[0].completed_sessions / operationalMetrics[0].total_sessions) * 100).toFixed(1)}%` : '0%',
          cancellation_rate: operationalMetrics[0].total_sessions > 0 ? 
            `${((operationalMetrics[0].cancelled_sessions / operationalMetrics[0].total_sessions) * 100).toFixed(1)}%` : '0%',
          avg_session_duration: `${parseInt(operationalMetrics[0].avg_session_duration || 0)} minutes`
        };
      }

      if (params.metric_type === 'marketing') {
        const marketingMetrics = await sql`
          SELECT 
            COUNT(*) as total_leads,
            COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted_leads,
            source,
            COUNT(*) as source_count
          FROM crm_leads
          WHERE created_at >= ${periodStart}
          GROUP BY source
          ORDER BY source_count DESC
        `;

        const totalLeads = marketingMetrics.reduce((sum, row) => sum + parseInt(row.source_count), 0);
        const totalConverted = marketingMetrics.reduce((sum, row) => sum + parseInt(row.converted_leads), 0);

        metrics.marketing = {
          total_leads: totalLeads,
          converted_leads: totalConverted,
          conversion_rate: totalLeads > 0 ? 
            `${((totalConverted / totalLeads) * 100).toFixed(1)}%` : '0%',
          lead_sources: marketingMetrics.map(source => ({
            source: source.source || 'Unknown',
            leads: source.source_count,
            conversions: source.converted_leads
          }))
        };
      }

      return metrics;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const reportsAnalyticsTools = [
  generateBusinessReportTool,
  getKPIDashboardTool,
  exportDataAnalyticsTool,
  getPerformanceMetricsTool
];