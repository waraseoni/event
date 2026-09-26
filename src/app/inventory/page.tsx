'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useLanguage } from '@/contexts/language-context'
import { useSystemSettings } from '@/contexts/system-settings-context'

export function InventoryPage() {
  const { t } = useLanguage()
  const { settings } = useSystemSettings()
  const { success, error: showError } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return
    const { error } = await supabase.from('inventory_items').delete().eq('id', id)
    if (error) { showError(error.message); return }
    success('Deleted')
    fetchItems()
  }

  const filtered = items.filter(i =>
    (i.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.company ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.unique_code ?? '').toLowerCase().includes(search.toLowerCase())
  )

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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
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
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <InventoryForm item={editing} onClose={() => { setShowForm(false); setEditing(null); fetchItems() }} />
      )}
    </div>
  )
}

function InventoryForm({ item, onClose }: { item: any; onClose: () => void }) {
  const { t } = useLanguage()
  const { success, error } = useToast()
  const [form, setForm] = useState({
    name: item?.name ?? '', company: item?.company ?? '', model: item?.model ?? '',
    scope: item?.scope ?? '', item_type: item?.item_type ?? 'owned',
    target_event_types: (item?.target_event_types ?? []).join(', '),
    estimated_rent_price: item?.estimated_rent_price ?? '',
    min_price: item?.min_price ?? '', security_deposit: item?.security_deposit ?? '',
    total_quantity: item?.total_quantity ?? 1, unit: item?.unit ?? 'piece',
    condition: item?.condition ?? 'good', notes: item?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name, company: form.company, model: form.model, scope: form.scope,
        item_type: form.item_type, target_event_types: form.target_event_types.split(',').map((s: string) => s.trim()).filter(Boolean),
        estimated_rent_price: Number(form.estimated_rent_price) || 0,
        min_price: Number(form.min_price) || 0, security_deposit: Number(form.security_deposit) || 0,
        total_quantity: Number(form.total_quantity), unit: form.unit, condition: form.condition, notes: form.notes,
      }
      if (item?.id) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', item.id)
        if (error) throw error
        success('Updated')
      } else {
        const { error } = await supabase.from('inventory_items').insert({ ...payload, status: 'available', unique_code: 'ITEM-' + Date.now() })
        if (error) throw error
        success('Created')
      }
      onClose()
    } catch (err: any) { error(err.message) }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-6 dark:bg-[#000000] space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item?.id ? 'Edit' : 'Add'} Item</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        {[
          { label: 'Name', key: 'name', required: true },
          { label: 'Company', key: 'company' },
          { label: 'Model', key: 'model' },
          { label: 'Scope', key: 'scope' },
          { label: 'Item Type', key: 'item_type', as: 'select', opts: ['owned', 'leased'] },
          { label: 'Target Event Types (comma sep)', key: 'target_event_types' },
          { label: 'Estimated Rent Price', key: 'estimated_rent_price', as: 'number' },
          { label: 'Min Price', key: 'min_price', as: 'number' },
          { label: 'Security Deposit', key: 'security_deposit', as: 'number' },
          { label: 'Total Quantity', key: 'total_quantity', as: 'number' },
          { label: 'Unit', key: 'unit' },
          { label: 'Condition', key: 'condition', as: 'select', opts: ['excellent', 'good', 'fair', 'poor'] },
          { label: 'Notes', key: 'notes', textarea: true },
        ].map(f => (
          <div key={f.key} className="space-y-1">
            <label className="block text-sm font-medium">{f.label}</label>
            {f.as === 'select' ? (
              <select value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded border p-2 text-sm">
                {f.opts!.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.textarea ? (
              <textarea value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded border p-2 text-sm" rows={2} />
            ) : (
              <input type={f.as ?? 'text'} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded border p-2 text-sm" />
            )}
          </div>
        ))}
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  )
}

export default InventoryPage
