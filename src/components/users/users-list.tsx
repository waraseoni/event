'use client'

import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, UserX } from 'lucide-react'

import { listUsers } from '@/lib/actions/users'
import { AddUserDialog } from './add-user-dialog'
import { ManageUserDialog } from './manage-user-dialog'
import { UserRoleBadge, UserStatusBadge } from './user-role-badge'
import { useCurrentUser } from '@/contexts/user-context'
import type { Profile, UserRole } from '@/types'

export function UsersList() {
  const { id: currentUserId } = useCurrentUser()
  const [users, setUsers] = useState<Profile[]>([])
  const [myRole, setMyRole] = useState<UserRole | null>(null)
  const [assignable, setAssignable] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const result = await listUsers()
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    setUsers(result.data.users)
    setMyRole(result.data.role)
    setAssignable(result.data.assignable)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      u.email.toLowerCase().includes(q) ||
      (u.display_name ?? '').toLowerCase().includes(q) ||
      u.role.includes(q)
    )
  })

  const isSuperAdmin = myRole === 'super_admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
        Loading users...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <ShieldAlert className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or role..."
          className="w-full sm:max-w-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
        />
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} of {users.length} user{users.length === 1 ? '' : 's'}
          </span>
          <AddUserDialog assignable={assignable} onCreated={load} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <UserX className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {users.length === 0 ? 'No users yet.' : 'No users match that search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((u) => {
                const isSelf = u.user_id === currentUserId
                return (
                  <tr
                    key={u.id}
                    className="bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {u.display_name || '—'}
                        {isSelf && (
                          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 break-all">
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UserRoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge isActive={u.is_active} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {u.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ManageUserDialog
                        user={u}
                        isSelf={isSelf}
                        assignable={assignable}
                        canEditRoles={isSuperAdmin}
                        canSetActive={isSuperAdmin}
                        onChanged={load}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
