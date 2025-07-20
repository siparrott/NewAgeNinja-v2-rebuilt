import { config } from 'dotenv';

// Load environment variables for testing
config();

// Ensure we have required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for tests');
}

// Set test environment
process.env.NODE_ENV = 'test';