import { ArrowLeftRight } from 'lucide-react'

export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ?? <ArrowLeftRight className="h-12 w-12 text-slate-300 dark:text-slate-700" />}
      <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
