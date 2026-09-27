import { cn } from '@/lib/utils'
import { USER_ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

const ROLE_STYLES: Record<UserRole, string> = {
  super_admin:
    'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 ring-purple-200 dark:ring-purple-900',
  admin:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-900',
  accountant:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-amber-200 dark:ring-amber-900',
  staff:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
}

export function UserRoleBadge({
  role,
  className,
}: {
  role: UserRole
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        ROLE_STYLES[role] ?? ROLE_STYLES.staff,
        className
      )}
    >
      {USER_ROLE_LABELS[role] ?? role}
    </span>
  )
}

export function UserStatusBadge({
  isActive,
  className,
}: {
  isActive: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        isActive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-rose-200 dark:ring-rose-900',
        className
      )}
    >
      {isActive ? 'Active' : 'Disabled'}
    </span>
  )
}
