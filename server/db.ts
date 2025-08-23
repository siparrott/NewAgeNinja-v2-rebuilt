import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema.js";

// Configure for serverless environment
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with serverless-optimized configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Single connection for serverless
  idleTimeoutMillis: 0, // No idle timeout
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
