'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTanStackQuery } from '@/hooks/use-query'
import { useToast } from '@/components/ui/toast'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/inventory'
import { listCategories, type CategoryRow } from '@/lib/queries/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

export function CategoriesPage() {
  const { success, error: showError } = useToast()
  const { data: categories, isLoading, refetch } = useTanStackQuery(['inventory', 'categories'], () => listCategories())
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [showForm, setShowForm] = useState(false)

  const rows = categories ?? []
  const parents = rows.filter(c => !c.parent_id)
  const childrenOf = (id: string) => rows.filter(c => c.parent_id === id)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? Items keep their data; their catalog link is cleared.`)) return
    try { await deleteCategory(id); success('Deleted'); refetch() }
    catch (err) { showError(err instanceof Error ? err.message : String(err)) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/inventory" className="text-xs text-muted-foreground hover:underline">← Inventory</Link>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Hierarchical catalog — sub-categories nest under a parent.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>Add category</Button>
      </div>

      {isLoading ? (
        <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : rows.length === 0 ? (
        <EmptyState title="No categories yet" description="Create the first one to organise the catalog." />
      ) : (
        <div className="space-y-2">
          {parents.map(p => (
            <div key={p.id}>
              <CategoryRowView row={p} isParent
                onEdit={() => { setEditing(p); setShowForm(true) }}
                onDelete={() => handleDelete(p.id, p.name)} />
              {childrenOf(p.id).map(c => (
                <div key={c.id} className="ml-8">
                  <CategoryRowView row={c}
                    onEdit={() => { setEditing(c); setShowForm(true) }}
                    onDelete={() => handleDelete(c.id, c.name)} />
                </div>
              ))}
            </div>
          ))}
          {rows.filter(c => c.parent_id && !rows.some(p => p.id === c.parent_id)).map(c => (
            <CategoryRowView key={c.id} row={c}
              onEdit={() => { setEditing(c); setShowForm(true) }}
              onDelete={() => handleDelete(c.id, c.name)} />
          ))}
        </div>
      )}

      {showForm && <CategoryForm item={editing} siblings={rows} onClose={() => { setShowForm(false); setEditing(null); refetch() }} />}
    </div>
  )
}

function CategoryRowView({ row, isParent, onEdit, onDelete }: {
  row: CategoryRow; isParent?: boolean; onEdit: () => void; onDelete: () => void
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-[#000000] p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{iconFor(row.icon)}</span>
        <span className="font-medium">{row.name}</span>
        {isParent && <Badge variant="info">parent</Badge>}
        {!row.is_active && <Badge variant="warning">inactive</Badge>}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  )
}

function iconFor(icon: string | null): string {
  const map: Record<string, string> = { box: '📦', light: '💡', sound: '🔊', decor: '🎀', furniture: '🪑', power: '🔌', stage: '🎪' }
  return map[icon ?? 'box'] ?? '📦'
}

const ICONS = ['box', 'light', 'sound', 'decor', 'furniture', 'power', 'stage']

function CategoryForm({ item, siblings, onClose }: { item: CategoryRow | null; siblings: CategoryRow[]; onClose: () => void }) {
  const { success, error } = useToast()
  const [form, setForm] = useState({
    name: item?.name ?? '', parent_id: item?.parent_id ?? '',
    icon: item?.icon ?? 'box', sort_order: String(item?.sort_order ?? 0),
    is_active: item?.is_active ?? true,
  })
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      try {
        const payload = { name: form.name, parent_id: form.parent_id || null, icon: form.icon, sort_order: Number(form.sort_order) || 0, is_active: form.is_active }
        if (item?.id) { await updateCategory(item.id, payload); success('Updated') }
        else { await createCategory(payload); success('Created') }
        onClose()
      } catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 dark:bg-[#000000] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item?.id ? 'Edit' : 'Add'} category</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        <div className="space-y-1"><label className="block text-sm font-medium">Name *</label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="space-y-1"><label className="block text-sm font-medium">Parent (empty = top level)</label>
          <select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} className="w-full rounded border p-2 text-sm">
            <option value="">— top level —</option>
            {siblings.filter(s => s.id !== item?.id && !s.parent_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><label className="block text-sm font-medium">Icon</label>
            <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="w-full rounded border p-2 text-sm">
              {ICONS.map(i => <option key={i} value={i}>{iconFor(i)} {i}</option>)}
            </select></div>
          <div className="space-y-1"><label className="block text-sm font-medium">Sort order</label>
            <Input inputMode="numeric" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export default CategoriesPage
