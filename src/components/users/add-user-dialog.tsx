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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KeyRound, Loader2, UserPlus } from 'lucide-react'

import { createUser } from '@/lib/actions/users'
import { USER_ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

interface AddUserDialogProps {
  /** Roles the current user is allowed to hand out, from the server. */
  assignable: UserRole[]
  onCreated: () => void
}

export function AddUserDialog({ assignable, onCreated }: AddUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    display_name: '',
    email: '',
    password: '',
    role: (assignable[0] ?? 'staff') as UserRole,
    phone: '',
  })

  const reset = () => {
    setForm({
      display_name: '',
      email: '',
      password: '',
      role: (assignable[0] ?? 'staff') as UserRole,
      phone: '',
    })
    setError(null)
  }

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (!open) reset()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createUser({
      email: form.email,
      password: form.password,
      role: form.role,
      display_name: form.display_name || undefined,
      phone: form.phone || undefined,
    })

    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setIsOpen(false)
    reset()
    onCreated()
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add User
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-2xl sm:rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Add User
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Creates a login immediately. Share the password with them directly - it is not
              emailed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="new-user-name"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="new-user-name"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Ravi Kumar"
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-user-phone"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Phone
                  </Label>
                  <Input
                    id="new-user-phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="new-user-email"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-user-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ravi@company.com"
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="new-user-role"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(value: string) =>
                    setForm({ ...form, role: value as UserRole })
                  }
                >
                  <SelectTrigger
                    id="new-user-role"
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                  >
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You can only assign roles below your own.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="new-user-password"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-user-password"
                    type="text"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 pl-9 font-mono"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shown in plain text so you can copy it and pass it on. The user can change it
                  later.
                </p>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || assignable.length === 0}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Create Login
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
