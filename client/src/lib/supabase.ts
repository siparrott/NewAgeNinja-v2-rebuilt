import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtnwccyxwrevfnbkjvzm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bndjY3l4d3JldmZuYmtqdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgwMTgsImV4cCI6MjA2NTgyNDAxOH0.MiOeCq2NCD969D_SXQ1wAlheSvRY5h04cUnV0XNuOrc';

// Supabase configuration initialized

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Enhanced connection test with better error handling
export const testSupabaseConnection = async () => {
  try {
    // Testing Supabase connection
    
    // Test basic connectivity with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const { data, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);
      
      if (error) {
        // console.error removed
        return { success: false, error: error.message };
      }
      
      // Supabase auth connection successful
    } catch (authError) {
      clearTimeout(timeoutId);
      // console.error removed
      
      // Don't fail completely on auth errors, try database test
      if (authError.name === 'AbortError') {
        return { success: false, error: 'Connection timeout - please check your Supabase URL and internet connection' };
      }
    }
    
    // Test database connectivity by trying to query a simple table with timeout
    try {
      const dbController = new AbortController();
      const dbTimeoutId = setTimeout(() => dbController.abort(), 5000); // 5 second timeout
      
      const { error: dbError } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1)
        .abortSignal(dbController.signal);
      
      clearTimeout(dbTimeoutId);
      
      if (dbError) {
        // console.error removed
        return { success: false, error: `Database error: ${dbError.message}` };
      }
      
      // Database connectivity test successful
    } catch (dbErr) {
      // console.error removed
      
      if (dbErr.name === 'AbortError') {
        return { success: false, error: 'Database connection timeout - please check your Supabase project status' };
      }
      
      return { success: false, error: `Database connectivity failed: ${dbErr.message || 'Unknown error'}` };
    }
    
    // Supabase connection test successful
    return { success: true };
  } catch (err) {
    // console.error removed
    
    if (err.name === 'AbortError') {
      return { success: false, error: 'Connection timeout - please check your network connection' };
    }
    
    return { success: false, error: err instanceof Error ? err.message : 'Unknown connection error' };
  }
};

// Enhanced project status check with more detailed error handling
export const checkSupabaseProjectStatus = async () => {
  try {
    // Try to make a simple request to check if the project is active
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 503) {
      return { 
        active: false, 
        error: 'Supabase project appears to be paused or inactive. Please check your Supabase dashboard and ensure your project is active.',
        statusCode: 503
      };
    }

    if (response.status === 500) {
      return { 
        active: false, 
        error: 'Supabase project is experiencing internal server errors. This may indicate database connectivity issues or service maintenance.',
        statusCode: 500
      };
    }

    if (!response.ok && response.status !== 404) {
      return { 
        active: false, 
        error: `Supabase project returned status ${response.status}. Please verify your project configuration and check the Supabase status page.`,
        statusCode: response.status
      };
    }

    // Additional check: try to access the auth endpoint
    try {
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });

      if (authResponse.status === 500) {
        return { 
          active: false, 
          error: 'Supabase authentication service is experiencing issues. The project may be paused or there may be database connectivity problems.',
          statusCode: 500
        };
      }
    } catch (authError) {
      // console.warn removed
      // Don't fail the entire check if auth endpoint fails
    }

    return { active: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { 
        active: false, 
        error: 'Connection timeout while checking Supabase project status. Please check your internet connection and try again.',
        statusCode: 408
      };
    }

    return { 
      active: false, 
      error: `Failed to connect to Supabase project: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify your VITE_SUPABASE_URL is correct.`,
      statusCode: 0
    };
  }
};

// Utility function to check if error is related to project being paused
export const isProjectPausedError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const errorCode = error.code || '';
  
  return (
    errorMessage.includes('Database error querying schema') ||
    errorMessage.includes('unexpected_failure') ||
    errorCode === 'unexpected_failure' ||
    errorMessage.includes('503') ||
    errorMessage.includes('project is paused')
  );
};

// Test connection on initialization with error handling
testSupabaseConnection().catch(error => {
  // console.warn removed
  // Don't throw here to prevent app from crashing on startup
});