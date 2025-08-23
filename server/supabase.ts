import { createClient } from "@supabase/supabase-js";

// Supabase configuration for serverless deployment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL must be set in environment variables');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { 
    persistSession: false, 
    autoRefreshToken: false 
  },
  db: {
    schema: 'public',
  },
});

// Public client for frontend operations (with RLS)
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey || supabaseServiceKey, // Fallback to service key if anon key not set
  {
    auth: {
      persistSession: false, // Important for serverless
    },
    db: {
      schema: 'public',
    },
  }
);

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any, operation: string) {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(`Database ${operation} failed: ${error.message}`);
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('photography_sessions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Testing with alternative table names...');
      // Try alternative table name if photography_sessions doesn't exist
      const { data: altData, error: altError } = await supabaseAdmin
        .from('photographySessions')
        .select('id')
        .limit(1);
      
      if (altError) throw altError;
    }
    
    return { success: true, message: 'Supabase connection successful' };
  } catch (error: any) {
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}
