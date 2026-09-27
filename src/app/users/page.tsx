import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

import { UsersList } from '@/components/users/users-list'
import { getCurrentUser } from '@/lib/supabase/session'

export const metadata = { title: 'Users & Roles' }

export default async function UsersPage() {
  // Nav gating hides this link from lower roles, but a direct URL would still
  // reach here, so refuse on the server too.
  const me = await getCurrentUser()
  if (!me) redirect('/auth/login')
  if (me.role !== 'super_admin' && me.role !== 'admin') redirect('/')

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Users &amp; Roles
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Create logins and control what each person can reach.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      </div>

      <UsersList />
    </div>
  )
}
