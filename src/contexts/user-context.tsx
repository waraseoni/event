'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import type { UserRole } from '@/types'

/**
 * The signed-in user's own profile, used for role-gating the nav and naming
 * them in the topbar.
 *
 * `role` stays null until the profile is actually read, so admin-only nav items
 * are hidden rather than briefly shown to someone who turns out not to have the
 * role. This is a display concern only - every permission is enforced again in
 * the database, so a stale or forged role here grants nothing.
 */

interface CurrentUserState {
  id: string | null
  email: string | null
  displayName: string | null
  role: UserRole | null
  loading: boolean
}

interface CurrentUserContextType extends CurrentUserState {
  refresh: () => Promise<void>
  can: (...roles: UserRole[]) => boolean
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined)

const INITIAL: CurrentUserState = {
  id: null,
  email: null,
  displayName: null,
  role: null,
  loading: true,
}

const VALID_ROLES: readonly UserRole[] = ['super_admin', 'admin', 'accountant', 'staff']

function asRole(value: unknown): UserRole | null {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : null
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CurrentUserState>(INITIAL)

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabaseBrowser.auth.getUser()
      const user = data?.user

      if (error || !user) {
        setState({ ...INITIAL, loading: false })
        return
      }

      // Permitted for every signed-in user by the "Users can view own" policy.
      const { data: profile } = await supabaseBrowser
        .from('profiles')
        .select('role, display_name')
        .eq('user_id', user.id)
        .maybeSingle()

      setState({
        id: user.id,
        email: user.email ?? null,
        displayName: profile?.display_name ?? null,
        role: asRole(profile?.role),
        loading: false,
      })
    } catch (err) {
      console.error('[CurrentUserProvider]', err)
      setState({ ...INITIAL, loading: false })
    }
  }, [])

  useEffect(() => {
    refresh()

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        refresh()
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const can = useCallback(
    (...roles: UserRole[]) => !!state.role && roles.includes(state.role),
    [state.role]
  )

  return (
    <CurrentUserContext.Provider value={{ ...state, refresh, can }}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext)
  if (ctx === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider')
  }
  return ctx
}
