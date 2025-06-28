import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

// Validate anon key format (should be a JWT)
if (!supabaseAnonKey.startsWith('eyJ')) {
  throw new Error('Invalid Supabase anon key format - should be a JWT token');
}

console.log('Supabase configuration:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
});

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
    console.log('Testing Supabase connection...');
    
    // Test basic connectivity with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const { data, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Supabase auth test failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Supabase auth connection successful');
    } catch (authError) {
      clearTimeout(timeoutId);
      console.error('Supabase auth connection failed:', authError);
      
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
        console.error('Database connectivity test failed:', dbError);
        return { success: false, error: `Database error: ${dbError.message}` };
      }
      
      console.log('Database connectivity test successful');
    } catch (dbErr) {
      console.error('Database connectivity test failed:', dbErr);
      
      if (dbErr.name === 'AbortError') {
        return { success: false, error: 'Database connection timeout - please check your Supabase project status' };
      }
      
      return { success: false, error: `Database connectivity failed: ${dbErr.message || 'Unknown error'}` };
    }
    
    console.log('Supabase connection test successful');
    return { success: true };
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    
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
      console.warn('Auth endpoint check failed:', authError);
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
  console.warn('Initial Supabase connection test failed:', error);
  // Don't throw here to prevent app from crashing on startup
});