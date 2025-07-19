// Auto-generate CRUD tools for all CRM tables with studio_id
import { promises as fs } from "fs";
import { neon } from '@neondatabase/serverless';

async function generateAutoTools() {
  console.log('🛠️ Generating auto-tools for all CRM tables...');
  
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get all CRM tables from our schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'crm_%'
      AND table_name NOT LIKE '%_old'
    `;
    
    const tableNames = [...new Set(tables.map(t => t.table_name))];
    console.log('📊 Found CRM tables:', tableNames);
    
    for (const tableName of tableNames) {
      const pascalCase = tableName.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
      const camelCase = tableName.replace(/_(\w)/g, (_, c) => c.toUpperCase());
      
      // Get table columns for smart search
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      const searchableColumns = columns
        .filter(c => c.column_name !== 'studio_id' && 
                    (c.data_type === 'text' || c.data_type === 'character varying'))
        .map(c => c.column_name);
      
      const toolContent = `// Auto-generated CRUD tools for ${tableName}
import { z } from "zod";
import { neon } from '@neondatabase/serverless';
import type { AgentCtx } from "../core/ctx";

const sql = neon(process.env.DATABASE_URL!);

/* READ ${tableName.toUpperCase()} */
export const read${pascalCase} = {
  name: "read_${tableName}",
  description: "Read records from ${tableName} table with search and filtering",
  parameters: z.object({
    limit: z.number().default(25).describe("Maximum number of records to return"),
    search: z.string().optional().describe("Search term to filter records"),
    status: z.string().optional().describe("Filter by status if applicable")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      let query = \`SELECT * FROM ${tableName}\`;
      const params = [];
      
      if (args.search) {
        const searchConditions = [${searchableColumns.map(col => `"${col} ILIKE $${searchableColumns.indexOf(col) + 1}"`).join(', ')}];
        query += \` WHERE (\${searchConditions.join(' OR ')})\`;
        ${searchableColumns.map((_, i) => `params.push(\`%\${args.search}%\`);`).join('\n        ')}
      }
      
      if (args.status) {
        if (args.search) {
          query += \` AND status = $\${params.length + 1}\`;
        } else {
          query += \` WHERE status = $\${params.length + 1}\`;
        }
        params.push(args.status);
      }
      
      query += \` ORDER BY created_at DESC LIMIT $\${params.length + 1}\`;
      params.push(args.limit);
      
      const result = await sql(query, params);
      return {
        success: true,
        data: result,
        count: result.length,
        table: "${tableName}"
      };
    } catch (error) {
      console.error(\`❌ read_${tableName} error:\`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Read operation failed",
        table: "${tableName}"
      };
    }
  }
};

/* CREATE ${tableName.toUpperCase()} */
export const create${pascalCase} = {
  name: "create_${tableName}",
  description: "Create a new record in ${tableName} table",
  parameters: z.object({
    data: z.record(z.any()).describe("Data object with fields to insert")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Use data as provided (no studio_id for this schema)
      const insertData = { ...args.data };
      
      // Build dynamic insert query
      const columns = Object.keys(insertData);
      const placeholders = columns.map((_, i) => \`$\${i + 1}\`);
      const values = Object.values(insertData);
      
      const query = \`
        INSERT INTO ${tableName} (\${columns.join(', ')}) 
        VALUES (\${placeholders.join(', ')}) 
        RETURNING *
      \`;
      
      const result = await sql(query, values);
      return {
        success: true,
        data: result[0],
        message: \`Created new ${tableName} record\`,
        table: "${tableName}"
      };
    } catch (error) {
      console.error(\`❌ create_${tableName} error:\`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Create operation failed",
        table: "${tableName}"
      };
    }
  }
};

/* UPDATE ${tableName.toUpperCase()} */
export const update${pascalCase} = {
  name: "update_${tableName}",
  description: "Update an existing record in ${tableName} table",
  parameters: z.object({
    id: z.string().describe("ID of the record to update"),
    data: z.record(z.any()).describe("Data object with fields to update")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Build dynamic update query
      const updateFields = Object.keys(args.data);
      const setClause = updateFields.map((field, i) => \`\${field} = $\${i + 1}\`).join(', ');
      const values = [...Object.values(args.data), args.id, ctx.studioId];
      
      const query = \`
        UPDATE ${tableName} 
        SET \${setClause}, updated_at = NOW() 
        WHERE id = $\${updateFields.length + 1}
        RETURNING *
      \`;
      
      const result = await sql(query, [...Object.values(args.data), args.id]);
      
      if (result.length === 0) {
        return {
          success: false,
          error: \`No ${tableName} record found with id \${args.id}\`,
          table: "${tableName}"
        };
      }
      
      return {
        success: true,
        data: result[0],
        message: \`Updated ${tableName} record\`,
        table: "${tableName}"
      };
    } catch (error) {
      console.error(\`❌ update_${tableName} error:\`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update operation failed",
        table: "${tableName}"
      };
    }
  }
};
`;

      await fs.writeFile(`agent/tools/${tableName}-auto.ts`, toolContent);
      console.log(`✅ Generated tools for ${tableName}`);
    }
    
    console.log('🎉 Auto-tools generation complete!');
    
  } catch (error) {
    console.error('❌ Auto-tools generation failed:', error);
  }
}

generateAutoTools();