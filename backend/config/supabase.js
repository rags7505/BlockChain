import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Public client (respects RLS) - for user-context operations
// Use this when you want RLS policies to be enforced
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS) - for administrative operations
// Use this for backend operations that need full database access
// IMPORTANT: Never expose this client to frontend code
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Log warning if service role key is not configured
if (!supabaseServiceKey) {
  console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not configured!');
  console.warn('⚠️  RLS security cannot be enforced properly.');
  console.warn('⚠️  Add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
}
