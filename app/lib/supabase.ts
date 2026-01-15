import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/database';

/**
 * Browser-side Supabase client
 * Used in client components for queries and real-time subscriptions
 * Respects Row Level Security (RLS) policies
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Alias for supabase (same client)
 */
export const supabaseClient = supabase;

/**
 * Server-side admin client with full database access
 * ONLY for use in API routes and server-side operations
 * Bypasses Row Level Security - use with caution!
 * 
 * Use for:
 * - Creating/updating records from webhook handlers
 * - Service-level operations that need to bypass RLS
 * - Admin operations that need full database access
 * 
 * DO NOT:
 * - Use in client components
 * - Expose SUPABASE_SERVICE_ROLE_KEY to frontend
 * - Return data directly from admin queries to client
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create an authenticated server client from a cookie store
 * Use in Server Components or API routes where you need user context
 */
export function createServerClient(cookieStore?: any) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Type exports for TypeScript
 */
export type { Database } from '@/app/types/database';
