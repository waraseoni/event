'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { supabaseServer } from '@/lib/supabase/server'
import { requireCurrentUser, supabaseRequest } from '@/lib/supabase/session'
import { canAssignRole, USER_ROLES } from '@/types'
import type { Profile, UserRole } from '@/types'

/**
 * User administration.
 *
 * Every action resolves the caller first and refuses anything outside their
 * place in the hierarchy. The same rules are enforced a second time in the
 * database by public.can_assign_role() and the
 * guard_profile_privileged_fields trigger, so a bug here cannot escalate
 * anyone - these checks exist to return a clear error instead of a raw
 * constraint violation.
 *
 * Reads go through the request-scoped client so RLS applies. Writes that RLS
 * deliberately denies (creating the auth account) go through the service role.
 */

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string }

const ROLES = USER_ROLES

const emailSchema = z.string().trim().toLowerCase().email('A valid email is required')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  const e = error as { message?: string; code?: string } | null
  const message = e?.message || fallback
  console.error('[users action]', { code: e?.code, message })
  return { ok: false, error: message }
}

/** Roles the caller is allowed to hand out, per public.can_assign_role(). */
function assignableRoles(actor: UserRole): UserRole[] {
  return ROLES.filter((r) => canAssignRole(actor, r))
}

/** Users who may administer accounts at all. */
function canAdminister(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin'
}

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    email: String(row.email),
    role: row.role as UserRole,
    display_name: (row.display_name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

/**
 * Every profile the caller is allowed to see, plus the caller's own role so the
 * UI can hide what they cannot do. Staff and accountants get a refusal rather
 * than a silent empty list.
 */
export async function listUsers(): Promise<
  ActionResult<{ users: Profile[]; role: UserRole; assignable: UserRole[] }>
> {
  try {
    const me = await requireCurrentUser()
    if (!canAdminister(me.role)) {
      return { ok: false, error: 'You do not have permission to view users.' }
    }

    // Read through the request-scoped client, not the service role, so the
    // "Super admin+ admin can view all" policy is actually applied. A caller
    // whose profile was demoted a moment ago is refused here.
    const supabase = await supabaseRequest()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) return fail(error, 'Could not load users.')

    return {
      ok: true,
      data: {
        users: (data ?? []).map((r) => toProfile(r as Record<string, unknown>)),
        role: me.role,
        assignable: assignableRoles(me.role),
      },
    }
  } catch (err) {
    return fail(err, 'Could not load users.')
  }
}

/**
 * Create a login.
 *
 * The admin types the password and shares it out of band. That keeps this
 * working without configuring SMTP, at the cost of the admin knowing the
 * password - fine for a small internal team, revisit if you add email invites.
 */
export async function createUser(raw: unknown): Promise<ActionResult<{ user: Profile }>> {
  const parsed = z
    .object({
      email: emailSchema,
      password: passwordSchema,
      role: z.enum(['super_admin', 'admin', 'accountant', 'staff'] as [UserRole, ...UserRole[]]),
      display_name: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(32).optional(),
    })
    .safeParse(raw)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid details.' }
  }

  const { email, password, role, display_name, phone } = parsed.data

  let createdUserId: string
  try {
    const me = await requireCurrentUser()
    if (!canAdminister(me.role)) {
      return { ok: false, error: 'You do not have permission to create users.' }
    }
    if (!canAssignRole(me.role, role)) {
      return {
        ok: false,
        error: `You cannot create another ${role.replace('_', ' ')}.`,
      }
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: display_name ? { full_name: display_name } : undefined,
    })

    if (error) return fail(error, 'Could not create the user.')
    if (!data?.user) return { ok: false, error: 'Could not create the user.' }

    createdUserId = data.user.id
  } catch (err) {
    return fail(err, 'Could not create the user.')
  }

  // The on_auth_user_created trigger has normally already inserted a profile
  // with role 'staff'. Upsert rather than insert so this works whether or not
  // that trigger is present, and so re-running cannot produce a duplicate.
  const { data: profile, error: profileError } = await supabaseServer
    .from('profiles')
    .upsert(
      {
        user_id: createdUserId,
        email,
        role,
        display_name: display_name || null,
        phone: phone || null,
        is_active: true,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (profileError) {
    return fail(
      profileError,
      'The login was created but its profile could not be set. Check the on_auth_user_created trigger.'
    )
  }

  revalidatePath('/users')
  return { ok: true, data: { user: toProfile(profile as Record<string, unknown>) } }
}

/**
 * Change a role. Super admin only, and only downwards - there is exactly one
 * super_admin, minted by supabase/seed/bootstrap-super-admin.sql. A different
 * super admin is granted by editing that email in the bootstrap script and
 * re-running it.
 */
export async function updateUserRole(
  raw: unknown
): Promise<ActionResult<{ user: Profile }>> {
  const parsed = z
    .object({
      userId: z.string().uuid(),
      role: z.enum(['super_admin', 'admin', 'accountant', 'staff'] as [UserRole, ...UserRole[]]),
    })
    .safeParse(raw)

  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const { userId, role } = parsed.data

  try {
    const me = await requireCurrentUser()
    if (me.role !== 'super_admin') {
      return { ok: false, error: 'Only a super admin can change roles.' }
    }
    if (me.id === userId) {
      return { ok: false, error: 'You cannot change your own role.' }
    }

    const { data: existing, error: readError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (readError) return fail(readError, 'Could not load that user.')
    if (!existing) return { ok: false, error: 'That user no longer exists.' }

    const currentRole = (existing as { role: UserRole }).role
    if (currentRole === 'super_admin') {
      return {
        ok: false,
        error: 'The super admin role cannot be reassigned from the app.',
      }
    }
    if (!canAssignRole(me.role, role)) {
      return { ok: false, error: `You cannot assign the ${role} role.` }
    }

    const { data, error } = await supabaseServer
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return fail(error, 'Could not change the role.')
    revalidatePath('/users')
    return { ok: true, data: { user: toProfile(data as Record<string, unknown>) } }
  } catch (err) {
    return fail(err, 'Could not change the role.')
  }
}

/** Enable or disable a login. Super admin only; nobody may do this to themselves. */
export async function setUserActive(raw: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ userId: z.string().uuid(), isActive: z.boolean() })
    .safeParse(raw)

  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const { userId, isActive } = parsed.data

  try {
    const me = await requireCurrentUser()
    if (me.role !== 'super_admin') {
      return { ok: false, error: 'Only a super admin can enable or disable logins.' }
    }
    if (me.id === userId) {
      return { ok: false, error: 'You cannot disable your own login.' }
    }

    const { data: existing, error: readError } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (readError) return fail(readError, 'Could not load that user.')
    if (!existing) return { ok: false, error: 'That user no longer exists.' }
    if ((existing as { role: UserRole }).role === 'super_admin') {
      return { ok: false, error: 'The super admin login cannot be disabled.' }
    }

    const { error } = await supabaseServer
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) return fail(error, 'Could not update the login.')

    // Keep Supabase Auth in step, so a disabled profile cannot slip in with a
    // still-valid session.
    const { error: banError } = await supabaseServer.auth.admin.updateUserById(userId, {
      ban_duration: isActive ? 'none' : '876000h',
    })
    if (banError) return fail(banError, 'Profile updated, but the login was not locked.')

    revalidatePath('/users')
    return { ok: true }
  } catch (err) {
    return fail(err, 'Could not update the login.')
  }
}

/**
 * Set a new password. Available to any administrator for accounts strictly
 * below them, so a forgotten password does not need a super admin.
 */
export async function resetUserPassword(raw: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ userId: z.string().uuid(), password: passwordSchema })
    .safeParse(raw)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' }
  }

  const { userId, password } = parsed.data

  try {
    const me = await requireCurrentUser()
    if (!canAdminister(me.role)) {
      return { ok: false, error: 'You do not have permission to reset passwords.' }
    }

    const { data: existing, error: readError } = await supabaseServer
      .from('profiles')
      .select('role, is_active')
      .eq('user_id', userId)
      .maybeSingle()

    if (readError) return fail(readError, 'Could not load that user.')
    if (!existing) return { ok: false, error: 'That user no longer exists.' }

    const target = existing as { role: UserRole; is_active: boolean }
    if (me.id === userId) {
      return { ok: false, error: 'Use the change-password flow for your own account.' }
    }
    if (target.role === 'super_admin') {
      return { ok: false, error: "The super admin's password cannot be reset here." }
    }
    if (!canAssignRole(me.role, target.role)) {
      return { ok: false, error: 'That account is not below you.' }
    }
    if (!target.is_active) {
      return { ok: false, error: 'Enable that login before resetting its password.' }
    }

    const { error } = await supabaseServer.auth.admin.updateUserById(userId, { password })
    if (error) return fail(error, 'Could not reset the password.')

    revalidatePath('/users')
    return { ok: true }
  } catch (err) {
    return fail(err, 'Could not reset the password.')
  }
}

/**
 * Permanently delete a login and its profile. Super admin only, and never your
 * own account. The auth.users row goes first; the profile cascades from it.
 */
export async function deleteUser(raw: unknown): Promise<ActionResult> {
  const parsed = z.object({ userId: z.string().uuid() }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const { userId } = parsed.data

  try {
    const me = await requireCurrentUser()
    if (me.role !== 'super_admin') {
      return { ok: false, error: 'Only a super admin can delete logins.' }
    }
    if (me.id === userId) {
      return { ok: false, error: 'You cannot delete your own login.' }
    }

    const { data: existing, error: readError } = await supabaseServer
      .from('profiles')
      .select('role, email')
      .eq('user_id', userId)
      .maybeSingle()

    if (readError) return fail(readError, 'Could not load that user.')
    if (!existing) return { ok: false, error: 'That user no longer exists.' }
    if ((existing as { role: UserRole }).role === 'super_admin') {
      return { ok: false, error: 'The super admin login cannot be deleted here.' }
    }

    const { error } = await supabaseServer.auth.admin.deleteUser(userId)
    if (error) return fail(error, 'Could not delete the login.')

    revalidatePath('/users')
    return { ok: true }
  } catch (err) {
    return fail(err, 'Could not delete the login.')
  }
}
