'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTanStackQuery } from '@/hooks/use-query'
import { useToast } from '@/components/ui/toast'
import { listOpenMaintenance, maintenanceDue, listItems } from '@/lib/queries/inventory'
import { createMaintenance, completeMaintenance } from '@/lib/actions/maintenance'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { useSystemSettings } from '@/contexts/system-settings-context'

export function MaintenancePage() {
  const { success, error: showError } = useToast()
  const { settings } = useSystemSettings()
  const [showForm, setShowForm] = useState(false)
  const { data: open, isLoading: openLoading, refetch: refetchOpen } = useTanStackQuery(['inventory', 'maintenance', 'open'], () => listOpenMaintenance())
  const { data: due, isLoading: dueLoading, refetch: refetchDue } = useTanStackQuery(['inventory', 'maintenance', 'due'], () => maintenanceDue(30))

  const money = (n: number | null | undefined) =>
    n != null ? `${settings?.currency_symbol ?? '₹'}${Number(n).toLocaleString('en-IN')}` : '-'

  async function handleComplete(id: string) {
    try { await completeMaintenance(id, {}); success('Completed — item available again'); refetchOpen(); refetchDue() }
    catch (err) { showError(err instanceof Error ? err.message : String(err)) }
  }

  const refetchAll = () => { refetchOpen(); refetchDue() }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/inventory" className="text-xs text-muted-foreground hover:underline">← Inventory</Link>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Open jobs, and items due for service in the next 30 days.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>New record</Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Open jobs <Badge variant="info">{(open ?? []).length}</Badge></h2>
        {openLoading ? (
          <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : (open ?? []).length === 0 ? (
          <EmptyState title="No open jobs" description="Everything is in service." />
        ) : (
          <div className="rounded-xl border bg-white dark:bg-[#000000] overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Since</TableHead><TableHead>Cost</TableHead><TableHead>Notes</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {(open ?? []).map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link className="hover:underline" href={`/inventory/${m.item_id}`}>{m.item_name ?? m.item_id.slice(0, 8)}</Link>
                    </TableCell>
                    <TableCell><Badge variant="warning">{m.maintenance_type}</Badge></TableCell>
                    <TableCell className="text-xs">{m.started_at ? new Date(m.started_at).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{money(m.cost)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.description ?? m.notes ?? '-'}</TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => handleComplete(m.id)}>Complete</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Due for service <Badge variant="info">{(due ?? []).length}</Badge></h2>
        {dueLoading ? (
          <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : (due ?? []).length === 0 ? (
          <EmptyState title="Nothing due" description="No item has a service date in the next 30 days." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(due ?? []).map(i => {
              const overdue = i.next_maintenance_date && i.next_maintenance_date < new Date().toISOString().slice(0, 10)
              return (
                <div key={i.id} className="rounded-xl border bg-white dark:bg-[#000000] p-4 flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/inventory/${i.id}`} className="font-medium hover:underline">{i.name}</Link>
                    <p className="text-xs text-muted-foreground">Due {i.next_maintenance_date}{overdue ? ' — overdue' : ''}</p>
                  </div>
                  {overdue ? <Badge variant="warning">overdue</Badge> : <Badge variant="info">due soon</Badge>}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {showForm && <MaintenanceForm onClose={() => { setShowForm(false); refetchAll() }} />}
    </div>
  )
}

function ItemPicker({ value, onChange }: { value: string; onChange: (id: string, name: string) => void }) {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300)
    return () => clearTimeout(id)
  }, [q])
  const { data } = useTanStackQuery(
    ['inventory', 'picker', debounced],
    () => listItems({ search: debounced || null }, 1, 8),
    { enabled: debounced.trim().length > 0 }
  )
  return (
    <div className="space-y-1 relative">
      <label className="block text-sm font-medium">Item *</label>
      <Input placeholder="Type to search items…" value={q} onChange={e => setQ(e.target.value)} />
      {debounced.trim() && (data?.rows ?? []).length > 0 && !value && (
        <div className="absolute z-10 w-full rounded border bg-white dark:bg-[#000000] shadow-lg max-h-48 overflow-y-auto">
          {(data?.rows ?? []).map(r => (
            <button key={r.id} type="button" className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => { onChange(r.id, r.name); setQ(r.name) }}>
              {r.name} <span className="text-muted-foreground">· {r.unique_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MaintenanceForm({ onClose }: { onClose: () => void }) {
  const { success, error } = useToast()
  const [itemId, setItemId] = useState('')
  const [form, setForm] = useState({ maintenance_type: 'service', description: '', cost: '', started_at: new Date().toISOString().slice(0, 10), notes: '' })
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      if (!itemId) { error('Pick an item first'); return }
      try {
        await createMaintenance({ item_id: itemId, maintenance_type: form.maintenance_type, description: form.description || undefined, cost: Number(form.cost) || 0, started_at: form.started_at, notes: form.notes || undefined })
        success('Record created — item set to maintenance'); onClose()
      } catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 dark:bg-[#000000] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New maintenance record</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        <ItemPicker value={itemId} onChange={(id, name) => { setItemId(id); void name }} />
        <div className="grid grid-cols-2 gap-2">
          <select value={form.maintenance_type} onChange={e => setForm({ ...form, maintenance_type: e.target.value })} className="rounded border p-2 text-sm">
            {['repair', 'service', 'calibration', 'upgrade', 'other'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <Input type="date" value={form.started_at} onChange={e => setForm({ ...form, started_at: e.target.value })} required />
        </div>
        <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Cost" inputMode="decimal" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
          <Input placeholder="Notes (opt)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export default MaintenancePage
