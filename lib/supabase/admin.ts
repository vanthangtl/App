import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client — uses the service_role key.
 * This bypasses Row Level Security and has full DB access.
 *
 * ⚠️  NEVER import this in client components or expose to the browser.
 *     Only use in Server Actions, Route Handlers, and middleware.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // Disable automatic session persistence — this is a server-only client
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
