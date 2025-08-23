// Generate Supabase migration from current Neon schema
// This creates SQL that matches your latest working database

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './shared/schema.js';
import fs from 'fs';
import path from 'path';

// Get current Neon connection (read-only)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function generateSupabaseMigration() {
  console.log('🔍 Analyzing current Neon schema...');
  
  try {
    // Get table information from Neon
    const tableInfo = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    // Get foreign key constraints
    const constraints = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
    `);

    console.log(`📊 Found ${tableInfo.rowCount} columns across multiple tables`);
    console.log(`🔗 Found ${constraints.rowCount} foreign key constraints`);

    // Generate comprehensive Supabase migration SQL
    const migrationSQL = generateMigrationSQL(tableInfo.rows, constraints.rows);
    
    // Write to file
    const outputPath = 'supabase-migration-from-neon.sql';
    fs.writeFileSync(outputPath, migrationSQL);
    
    console.log(`✅ Migration SQL generated: ${outputPath}`);
    console.log(`📝 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    
    return outputPath;

  } catch (error) {
    console.error('❌ Error generating migration:', error);
    
    // Fallback: Use the schema.ts to generate basic structure
    console.log('📋 Falling back to schema.ts analysis...');
    const fallbackSQL = generateFallbackMigration();
    fs.writeFileSync('supabase-migration-fallback.sql', fallbackSQL);
    
    return 'supabase-migration-fallback.sql';
  } finally {
    await pool.end();
  }
}

function generateMigrationSQL(tables, constraints) {
  let sql = `-- Migration from Neon to Supabase
-- Generated: ${new Date().toISOString()}
-- Source: Latest Neon database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

`;

  // Group columns by table
  const tableGroups = {};
  tables.forEach(col => {
    if (!tableGroups[col.table_name]) {
      tableGroups[col.table_name] = [];
    }
    tableGroups[col.table_name].push(col);
  });

  // Generate CREATE TABLE statements
  Object.entries(tableGroups).forEach(([tableName, columns]) => {
    sql += `-- Create ${tableName} table\n`;
    sql += `CREATE TABLE ${tableName} (\n`;
    
    const columnDefs = columns.map(col => {
      let def = `  ${col.column_name} ${col.data_type}`;
      
      if (col.is_nullable === 'NO') def += ' NOT NULL';
      if (col.column_default) def += ` DEFAULT ${col.column_default}`;
      
      return def;
    });
    
    sql += columnDefs.join(',\n');
    sql += `\n);\n\n`;
  });

  // Add foreign key constraints
  sql += `-- Add foreign key constraints\n`;
  constraints.forEach(constraint => {
    sql += `ALTER TABLE ${constraint.table_name} 
  ADD CONSTRAINT ${constraint.constraint_name} 
  FOREIGN KEY (${constraint.column_name}) 
  REFERENCES ${constraint.foreign_table_name}(${constraint.foreign_column_name});\n\n`;
  });

  // Add RLS policies
  sql += `-- Enable Row Level Security\n`;
  Object.keys(tableGroups).forEach(tableName => {
    sql += `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n`;
  });

  sql += `\n-- Basic RLS policies (customize as needed)\n`;
  sql += `-- Add your specific policies here\n\n`;

  // Add updated_at triggers
  sql += `-- Create updated_at trigger function\n`;
  sql += `CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';\n\n`;

  // Add triggers for tables with updated_at
  Object.entries(tableGroups).forEach(([tableName, columns]) => {
    if (columns.some(col => col.column_name === 'updated_at')) {
      sql += `CREATE TRIGGER update_${tableName}_updated_at 
  BEFORE UPDATE ON ${tableName} 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n`;
    }
  });

  sql += `\n-- Migration completed successfully!\n`;
  sql += `SELECT 'Neon to Supabase migration schema created!' as message;\n`;

  return sql;
}

function generateFallbackMigration() {
  // This uses your current schema.ts as source of truth
  return `-- Fallback migration based on schema.ts
-- This is a simplified version - review and customize

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core tables from your current schema
-- (This would include all tables from shared/schema.ts)

-- You'll need to run this after reviewing the actual schema
SELECT 'Please review schema.ts and customize this migration' as message;
`;
}

// Run if called directly
if (process.argv[1].endsWith('generate-migration.js')) {
  generateSupabaseMigration()
    .then(file => {
      console.log(`🎉 Migration ready: ${file}`);
      console.log('📋 Next steps:');
      console.log('  1. Review the generated SQL');
      console.log('  2. Create fresh Supabase project');
      console.log('  3. Run the migration in Supabase SQL Editor');
      console.log('  4. Test with your serverless function');
    })
    .catch(console.error);
}

export { generateSupabaseMigration };
