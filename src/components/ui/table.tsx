import * as React from 'react'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}><table className="w-full text-sm">{children}</table></div>
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}
export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}
export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50 ${className ?? ''}`} ref={ref} {...props} />
))
TableRow.displayName = 'TableRow'
export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td className={`px-4 py-3 ${className ?? ''}`} ref={ref} {...props} />
))
TableCell.displayName = 'TableCell'
export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th className={`px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 ${className ?? ''}`} ref={ref} {...props} />
))
TableHead.displayName = 'TableHead'
