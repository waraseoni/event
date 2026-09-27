'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KeyRound, Loader2, MoreVertical, ShieldCheck, Trash2, UserCog } from 'lucide-react'

import {
  deleteUser,
  resetUserPassword,
  setUserActive,
  updateUserRole,
} from '@/lib/actions/users'
import { USER_ROLE_LABELS } from '@/types'
import type { Profile, UserRole } from '@/types'
import { UserRoleBadge, UserStatusBadge } from './user-role-badge'

interface ManageUserDialogProps {
  user: Profile
  /** The signed-in user, for deciding which controls to offer. */
  isSelf: boolean
  assignable: UserRole[]
  canEditRoles: boolean
  canSetActive: boolean
  onChanged: () => void
}

export function ManageUserDialog({
  user,
  isSelf,
  assignable,
  canEditRoles,
  canSetActive,
  onChanged,
}: ManageUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [role, setRole] = useState<UserRole>(user.role)
  const [newPassword, setNewPassword] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  // The single super_admin is created by the bootstrap script, not the app.
  const roleLocked = user.role === 'super_admin' || isSelf
  const canReset = user.is_active && !isSelf && user.role !== 'super_admin'
  const canDelete = !isSelf && user.role !== 'super_admin'

  const close = () => {
    setIsOpen(false)
    setError(null)
    setNotice(null)
    setNewPassword('')
  }

  const run = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setBusy(key)
    setError(null)
    setNotice(null)
    const result = await fn()
    setBusy(null)
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
      return false
    }
    setNotice(okMsg)
    onChanged()
    return true
  }

  const handleRoleSave = async () => {
    if (role === user.role) return
    const done = await run(
      'role',
      () => updateUserRole({ userId: user.user_id, role }),
      `Role updated to ${USER_ROLE_LABELS[role]}.`
    )
    if (done) close()
  }

  const handleToggleActive = async () => {
    const next = !user.is_active
    await run(
      'active',
      () => setUserActive({ userId: user.user_id, isActive: next }),
      next ? 'Login enabled.' : 'Login disabled.'
    )
  }

  const handleResetPassword = async () => {
    const done = await run(
      'password',
      () => resetUserPassword({ userId: user.user_id, password: newPassword }),
      'Password reset.'
    )
    if (done) setNewPassword('')
  }

  const handleDelete = async () => {
    setBusy('delete')
    setError(null)
    const result = await deleteUser({ userId: user.user_id })
    setBusy(null)
    setConfirmOpen(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not delete the login.')
      return
    }
    close()
    onChanged()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label={`Manage ${user.email}`}
        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(o) => (o ? setIsOpen(true) : close())}>
        <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-2xl sm:rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Manage User
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 break-all">
              {user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                {notice}
              </div>
            )}

            <div className="flex items-center gap-2">
              <UserRoleBadge role={user.role} />
              <UserStatusBadge isActive={user.is_active} />
              {isSelf && (
                <span className="text-xs text-slate-500 dark:text-slate-400">This is you</span>
              )}
            </div>

            {/* ------------------------------ role ------------------------------ */}
            <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Role
                </h3>
              </div>

              {roleLocked ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isSelf
                    ? 'You cannot change your own role.'
                    : 'The super admin role is fixed. To hand it to someone else, edit the email at the top of supabase/seed/bootstrap-super-admin.sql and re-run that script.'}
                </p>
              ) : canEditRoles ? (
                <>
                  <Select value={role} onValueChange={(v: string) => setRole(v as UserRole)}>
                    <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignable.map((r) => (
                        <SelectItem key={r} value={r}>
                          {USER_ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleRoleSave}
                    disabled={busy !== null || role === user.role}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
                  >
                    {busy === 'role' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserCog className="h-4 w-4 mr-2" />
                    )}
                    Save Role
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Only a super admin can change roles.
                </p>
              )}
            </div>

            {/* ------------------------- enable / disable ----------------------- */}
            {canSetActive && !isSelf && (
              <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950/40">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Access
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {user.is_active
                    ? 'Disable to lock this person out without deleting their history.'
                    : 'Enable to let this person sign in again.'}
                </p>
                <Button
                  variant={user.is_active ? 'destructive' : 'default'}
                  onClick={handleToggleActive}
                  disabled={busy !== null}
                >
                  {busy === 'active' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {user.is_active ? 'Disable Login' : 'Enable Login'}
                </Button>
              </div>
            )}

            {/* --------------------------- reset password ----------------------- */}
            {canReset && (
              <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Reset Password
                  </h3>
                </div>
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password, at least 8 characters"
                  autoComplete="new-password"
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-mono"
                />
                <Button
                  onClick={handleResetPassword}
                  disabled={busy !== null || newPassword.length < 8}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
                >
                  {busy === 'password' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Set New Password
                </Button>
              </div>
            )}

            {/* ------------------------------ delete ---------------------------- */}
            {canDelete && canSetActive && (
              <div className="space-y-3 rounded-xl border border-rose-200 dark:border-rose-900 p-4 bg-rose-50/50 dark:bg-rose-950/20">
                <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                  Delete Login
                </h3>
                <p className="text-sm text-rose-700/80 dark:text-rose-300/80">
                  Permanent. The login and its profile are removed. Disabling is usually the
                  better option.
                </p>
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Button type="button" variant="outline" onClick={close} disabled={busy !== null}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${user.email}?`}
        description="This permanently removes the login and its profile. This cannot be undone."
        onConfirm={handleDelete}
        loading={busy === 'delete'}
        confirmLabel="Delete Login"
        loadingLabel="Deleting..."
      />
    </>
  )
}
