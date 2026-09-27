'use client'

import { useState } from 'react'
import { useTanStackQuery } from '@/hooks/use-query'
import { useToast } from '@/components/ui/toast'
import { useLanguage } from '@/contexts/language-context'
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/actions/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSystemSettings } from '@/contexts/system-settings-context'
import type { InventoryItem } from '@/types'
import type { Database } from '@/types/supabase'

type InventoryInsert = Database['public']['Tables']['inventory_items']['Insert']

export function InventoryPage() {
  const { t } = useLanguage()
  const { settings } = useSystemSettings()
  const { success, error: showError } = useToast()
  const { data: items, isLoading, refetch } = useTanStackQuery<InventoryItem[]>(['inventory'], () => getInventoryItems())
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = (items ?? []).filter((i: InventoryItem) =>
    (i.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.company ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.unique_code ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate() {
    setSaving(true)
    try {
      await createInventoryItem({ name: '', category: '', total_quantity: 1 })
      success('Created'); refetch(); setShowForm(false)
    } catch (err) { showError(err instanceof Error ? err.message : String(err)) }
    setSaving(false)
  }

  async function handleUpdate() {
    setSaving(true)
    try {
      await updateInventoryItem(editing!.id, {})
      success('Updated'); refetch(); setEditing(null); setShowForm(false)
    } catch (err) { showError(err instanceof Error ? err.message : String(err)) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    try { await deleteInventoryItem(id); success('Deleted'); refetch() }
    catch (err) { showError(err instanceof Error ? err.message : String(err)) }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('nav.inventory')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{settings?.system_name} — items &amp; rates</p>
          </div>
          <Button onClick={() => { setEditing(null); setShowForm(true) }}>{t('common.add')}</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Badge variant="info">{filtered.length} items</Badge>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item: InventoryItem) => (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#000000] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.company} · {item.model}</p>
                </div>
                <Badge variant={item.status === 'available' ? 'success' : 'warning'}>{item.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>Company: <span className="font-medium">{item.company}</span></div>
                <div>Model: <span className="font-medium">{item.model}</span></div>
                <div>Scope: <span className="font-medium">{item.scope}</span></div>
                <div>Type: <span className="font-medium">{item.item_type}</span></div>
                <div>Target: <span className="font-medium">{(item.target_event_types ?? []).join(', ') || '-'}</span></div>
                <div>Est. Rent: <span className="font-medium">{item.estimated_rent_price ? `${settings?.currency_symbol ?? '₹'}${item.estimated_rent_price}` : '-'}</span></div>
                <div>Qty: <span className="font-medium">{item.total_quantity}</span></div>
                <div>Unit: <span className="font-medium">{item.unit}</span></div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditing(item); setShowForm(true) }}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => { if (confirm('Delete?')) handleDelete(item.id) }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <InventoryForm item={editing} onClose={() => { setShowForm(false); setEditing(null); refetch() }} saving={saving} />
      )}
    </div>
  )
}

function InventoryForm({ item, onClose, saving }: { item: InventoryItem | null; onClose: () => void; saving: boolean }) {
  const { t } = useLanguage()
  const { success, error } = useToast()
  const [form, setForm] = useState({
    name: item?.name ?? '', category: item?.category ?? '', description: item?.description ?? '',
    company: item?.company ?? '', model: item?.model ?? '', scope: item?.scope ?? '',
    item_type: (item?.item_type ?? 'owned') as NonNullable<InventoryItem['item_type']>,
    target_event_types: (item?.target_event_types ?? []).join(', '),
    estimated_rent_price: String(item?.estimated_rent_price ?? ''),
    min_price: String(item?.min_price ?? ''),
    security_deposit: String(item?.security_deposit ?? ''),
    total_quantity: String(item?.total_quantity ?? 1), unit: item?.unit ?? 'piece',
    condition: (item?.condition ?? 'good') as NonNullable<InventoryItem['condition']>,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = { name: form.name, category: form.category, description: form.description || null, company: form.company || null, model: form.model || null, scope: form.scope || null, item_type: form.item_type, target_event_types: form.target_event_types.split(',').map((s) => s.trim()).filter(Boolean), estimated_rent_price: Number(form.estimated_rent_price) || 0, min_price: Number(form.min_price) || 0, security_deposit: Number(form.security_deposit) || 0, total_quantity: Number(form.total_quantity), unit: form.unit, condition: form.condition }
      if (item?.id) { await updateInventoryItem(item.id, payload); success('Updated') }
      else { await createInventoryItem({ ...payload, unique_code: 'INV-' + Date.now().toString(36).toUpperCase() }); success('Created') }
      onClose()
    } catch (err) { error(err instanceof Error ? err.message : String(err)) }
  }

  return (
    <form onSubmit={handleSubmit} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-6 dark:bg-[#000000] space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item?.id ? 'Edit' : 'Add'} Item</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        {[
          { label: 'Name', key: 'name', required: true }, { label: 'Category', key: 'category', required: true }, { label: 'Description', key: 'description', textarea: true },
          { label: 'Company', key: 'company' }, { label: 'Model', key: 'model' }, { label: 'Scope', key: 'scope' },
          { label: 'Item Type', key: 'item_type', as: 'select', opts: ['owned', 'leased'] as const },
          { label: 'Target Event Types (comma sep)', key: 'target_event_types' },
          { label: 'Estimated Rent Price', key: 'estimated_rent_price', as: 'number' as const },
          { label: 'Min Price', key: 'min_price', as: 'number' as const },
          { label: 'Security Deposit', key: 'security_deposit', as: 'number' as const },
          { label: 'Total Quantity', key: 'total_quantity', as: 'number' as const }, { label: 'Unit', key: 'unit' },
          { label: 'Condition', key: 'condition', as: 'select' as const, opts: ['excellent', 'good', 'fair', 'poor'] as const },
        ].map(f => (
          <div key={f.key} className="space-y-1">
            <label className="block text-sm font-medium">{f.label}{f.required ? ' *' : ''}</label>
            {f.as === 'select' ? (
              <select value={String((form as Record<string, unknown>)[f.key])} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded border p-2 text-sm">{f.opts!.map(o => <option key={o} value={o}>{o}</option>)}</select>
            ) : f.textarea ? (
              <textarea value={String((form as Record<string, unknown>)[f.key])} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded border p-2 text-sm" rows={2} />
            ) : (
              <input required={f.required} type={f.as ?? 'text'} value={String((form as Record<string, unknown>)[f.key])} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded border p-2 text-sm" />
            )}
          </div>
        ))}
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  )
}

export default InventoryPage
