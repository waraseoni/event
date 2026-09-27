import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client authenticated with the SERVICE ROLE key.
 *
 * The service role bypasses Row Level Security, so this module must never be
 * reachable from a client component. Client code must use
 * `@/lib/supabase/browser` (or the `supabase` re-export from `@/lib/supabase`).
 */
if (typeof window !== 'undefined') {
  throw new Error(
    'supabaseServer (service role) was imported into client code. ' +
      "Import from '@/lib/supabase/browser' instead."
  )
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required on the server.')
}

if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is required on the server. ' +
      'Add it to .env.local (and to your deployment platform env vars).'
  )
}

export const supabaseServer = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
