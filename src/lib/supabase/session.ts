import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { UserRole } from '@/types'

/**
 * Request-scoped Supabase client that carries the *caller's* JWT.
 *
 * `supabaseServer` (service role) bypasses RLS and has no notion of who is
 * asking, so it cannot answer "is this person allowed to do that". This client
 * is the counterpart: it is bound to the incoming request's cookies, so
 * `auth.uid()` resolves to the signed-in user and every query goes through RLS
 * exactly as it would from the browser.
 *
 * Use it for "who am I / what am I allowed to do". Use `supabaseServer` only
 * for privileged writes the RLS policies intentionally deny, such as
 * `auth.admin.createUser`.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'supabaseRequest was imported into client code. ' +
      "Import from '@/lib/supabase/browser' instead."
  )
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required on the server.')
}
if (!anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required on the server.')
}

// Re-bind as plain strings: the guards above narrow the env reads, but that
// narrowing is not carried into the closures below.
const SUPABASE_URL: string = url
const SUPABASE_ANON_KEY: string = anonKey

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

export async function supabaseRequest() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components cannot write cookies. Only Server Actions and
          // Middleware can, and they do not need this client. Swallow it rather
          // than failing the whole render.
        }
      },
    },
  })
}

export interface CurrentUser {
  id: string
  email: string
  displayName: string | null
  role: UserRole
}

const ROLES: readonly UserRole[] = ['super_admin', 'admin', 'accountant', 'staff']

function asRole(value: string | null | undefined): UserRole {
  return ROLES.includes(value as UserRole) ? (value as UserRole) : 'staff'
}

/**
 * Resolve the signed-in user and their role, or null when there is no session.
 *
 * The role is read from the caller's own profiles row rather than from an RPC,
 * because the "Users can view own" RLS policy already permits exactly that
 * read for every signed-in user - including a plain staff member, who cannot
 * list anyone else's profile. Returns null on no session or no profile row,
 * which is the same thing current_user_role() treats as 'staff'.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await supabaseRequest()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) return null

  const user = userData.user

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[getCurrentUser] could not read profile', {
      code: profileError.code,
      message: profileError.message,
    })
    return null
  }

  return {
    id: user.id,
    email: user.email ?? '',
    displayName: profile?.display_name ?? null,
    role: asRole(profile?.role),
  }
}

/**
 * Same as getCurrentUser() but throws instead of returning null.
 *
 * Server actions call this first so that an unauthenticated request fails with
 * a clear message instead of silently proceeding as 'staff'.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('You must be signed in to do that.')
  }
  return user
}
