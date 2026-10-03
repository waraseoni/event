'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTanStackQuery } from '@/hooks/use-query'
import { useToast } from '@/components/ui/toast'
import { useLanguage } from '@/contexts/language-context'
import {
  createInventoryItem, updateInventoryItem, deleteInventoryItem, retireItem,
  exportInventoryCsv, importInventoryCsvDryRun, importInventoryCsvApply,
} from '@/lib/actions/inventory'
import { listItems, listCategories, listLocations, type ItemFilter, type SearchRow } from '@/lib/queries/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { useSystemSettings } from '@/contexts/system-settings-context'
import type { InventoryItem } from '@/types'

const PAGE_SIZE = 24

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function InventoryPage() {
  const { t } = useLanguage()
  const { settings } = useSystemSettings()
  const { success, error: showError } = useToast()

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [company, setCompany] = useState('')
  const [itemType, setItemType] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const debouncedSearch = useDebounced(search)
  const debouncedCompany = useDebounced(company)

  const filter: ItemFilter = useMemo(() => ({
    search: debouncedSearch || null,
    categoryId: categoryId || null,
    locationId: locationId || null,
    company: debouncedCompany || null,
    itemType: itemType || null,
    status: status || null,
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
  }), [debouncedSearch, categoryId, locationId, debouncedCompany, itemType, status, minPrice, maxPrice])

  // Any filter change resets to the first page — done in each control's
  // onChange below (calling setState in an effect body is a lint error).

  const { data, isLoading, refetch } = useTanStackQuery(
    ['inventory', 'list', JSON.stringify({ ...filter, page })],
    () => listItems(filter, page, PAGE_SIZE)
  )
  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const { data: categories } = useTanStackQuery(['inventory', 'categories'], () => listCategories())
  const { data: locations } = useTanStackQuery(['inventory', 'locations'], () => listLocations())

  async function handleDelete(id: string) {
    try { await deleteInventoryItem(id); success('Deleted'); refetch() }
    catch (err) { showError(err instanceof Error ? err.message : String(err)) }
  }

  async function handleRetire(id: string) {
    try { await retireItem(id); success('Retired'); refetch() }
    catch (err) { showError(err instanceof Error ? err.message : String(err)) }
  }

  async function handleExport() {
    try {
      const { filename, csv } = await exportInventoryCsv(filter)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      success(`Exported ${rows.length} of ${total} items`)
    } catch (err) { showError(err instanceof Error ? err.message : String(err)) }
  }

  const money = (n: number | null | undefined) =>
    n != null && n !== 0 ? `${settings?.currency_symbol ?? '₹'}${Number(n).toLocaleString('en-IN')}` : '-'

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('nav.inventory')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{settings?.system_name} — items &amp; rates</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory/categories"><Button variant="outline" size="sm">Categories</Button></Link>
            <Link href="/inventory/locations"><Button variant="outline" size="sm">Locations</Button></Link>
            <Link href="/inventory/maintenance"><Button variant="outline" size="sm">Maintenance</Button></Link>
            <Button variant="outline" size="sm" onClick={handleExport}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>Import CSV</Button>
            <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>{t('common.add')}</Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-[#000000] p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input placeholder={t('common.search')} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
          <Input placeholder="Company" value={company} onChange={e => { setCompany(e.target.value); setPage(1) }} className="max-w-[10rem]" />
          <Select value={categoryId || 'all'} onValueChange={v => { setCategoryId(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[10rem]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={locationId || 'all'} onValueChange={v => { setLocationId(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[10rem]"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {(locations ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={itemType || 'all'} onValueChange={v => { setItemType(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[8rem]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Owned + leased</SelectItem>
              <SelectItem value="owned">Owned</SelectItem>
              <SelectItem value="leased">Leased</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status || 'all'} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[9rem]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Min ₹" inputMode="numeric" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1) }} className="max-w-[7rem]" />
          <Input placeholder="Max ₹" inputMode="numeric" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1) }} className="max-w-[7rem]" />
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="info">{total} items{total > PAGE_SIZE ? ` · page ${page} of ${totalPages}` : ''}</Badge>
          <div className="flex gap-1">
            <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setView('grid')}>Grid</Button>
            <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')}>Table</Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No items found" description="Try clearing a filter, or add the first item." />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((item: SearchRow) => (
            <ItemCard key={item.id} item={item} money={money}
              onEdit={() => { setEditing(item); setShowForm(true) }}
              onDelete={() => { if (confirm('Delete?')) handleDelete(item.id) }}
              onRetire={() => { if (confirm('Retire this item? Stock on hand will be written off through the ledger.')) handleRetire(item.id) }} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-white dark:bg-[#000000] overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Company</TableHead>
                <TableHead>Rent</TableHead><TableHead>Avail / Total</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item: SearchRow) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium"><Link className="hover:underline" href={`/inventory/${item.id}`}>{item.name}</Link></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.unique_code}</TableCell>
                  <TableCell>{item.company ?? '-'}</TableCell>
                  <TableCell>{money(item.estimated_rent_price)}</TableCell>
                  <TableCell>{item.available_quantity} / {item.total_quantity}</TableCell>
                  <TableCell><Badge variant={item.status === 'available' ? 'success' : 'warning'}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(item); setShowForm(true) }}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm('Retire this item?')) handleRetire(item.id) }}>Retire</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      )}

      {showForm && (
        <InventoryForm item={editing} onClose={() => { setShowForm(false); setEditing(null); refetch() }} saving={saving} />
      )}
      {showImport && <ImportWizard onClose={() => { setShowImport(false); refetch() }} />}
    </div>
  )
}

function ItemCard({ item, money, onEdit, onDelete, onRetire }: {
  item: SearchRow
  money: (n: number | null | undefined) => string
  onEdit: () => void
  onDelete: () => void
  onRetire: () => void
}) {
  const low = (item.reorder_level ?? 1) > 0 && item.available_quantity <= (item.reorder_level ?? 1)
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#000000] p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/inventory/${item.id}`} className="font-semibold hover:underline">{item.name}</Link>
          <p className="text-xs text-muted-foreground">{item.company ?? '-'} · {item.model ?? '-'}</p>
          <p className="text-xs text-muted-foreground">{item.unique_code}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={item.status === 'available' ? 'success' : 'warning'}>{item.status}</Badge>
          {low && item.status === 'available' && <Badge variant="warning">low stock</Badge>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>Scope: <span className="font-medium">{item.scope ?? '-'}</span></div>
        <div>Type: <span className="font-medium">{item.item_type ?? '-'}</span></div>
        <div>Target: <span className="font-medium">{(item.target_event_types ?? []).join(', ') || '-'}</span></div>
        <div>Est. Rent: <span className="font-medium">{money(item.estimated_rent_price)}</span></div>
        <div>Avail: <span className="font-medium">{item.available_quantity} / {item.total_quantity} {item.unit}</span></div>
        <div>Deposit: <span className="font-medium">{money(item.security_deposit)}</span></div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="outline" size="sm" onClick={onRetire}>Retire</Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  )
}

export function InventoryForm({ item, onClose, saving }: { item: InventoryItem | null; onClose: () => void; saving: boolean }) {
  const { success, error } = useToast()
  const { data: categories } = useTanStackQuery(['inventory', 'categories'], () => listCategories())
  const { data: locations } = useTanStackQuery(['inventory', 'locations'], () => listLocations())
  const [form, setForm] = useState({
    name: item?.name ?? '', category: item?.category ?? '', description: item?.description ?? '',
    company: item?.company ?? '', model: item?.model ?? '', scope: item?.scope ?? '',
    item_type: (item?.item_type ?? 'owned') as NonNullable<InventoryItem['item_type']>,
    target_event_types: (item?.target_event_types ?? []).join(', '),
    estimated_rent_price: String(item?.estimated_rent_price ?? ''),
    min_price: String(item?.min_price ?? ''),
    security_deposit: String(item?.security_deposit ?? ''),
    hsn_code: item?.hsn_code ?? '',
    total_quantity: String(item?.total_quantity ?? 1), unit: item?.unit ?? 'piece',
    condition: (item?.condition ?? 'good') as NonNullable<InventoryItem['condition']>,
    category_id: item?.category_id ?? '', location_id: item?.location_id ?? '',
    reorder_level: String(item?.reorder_level ?? 1),
    max_parallel_events: String(item?.max_parallel_events ?? 0),
    maintenance_interval_days: String(item?.maintenance_interval_days ?? 0),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        name: form.name, category: form.category, description: form.description || null,
        company: form.company || null, model: form.model || null, scope: form.scope || null,
        item_type: form.item_type,
        target_event_types: form.target_event_types.split(',').map((s) => s.trim()).filter(Boolean),
        estimated_rent_price: Number(form.estimated_rent_price) || 0,
        min_price: Number(form.min_price) || 0, security_deposit: Number(form.security_deposit) || 0,
        hsn_code: form.hsn_code || null,
        total_quantity: Number(form.total_quantity), unit: form.unit, condition: form.condition,
        category_id: form.category_id || null, location_id: form.location_id || null,
        reorder_level: Number(form.reorder_level) || 0,
        max_parallel_events: Number(form.max_parallel_events) || 0,
        maintenance_interval_days: Number(form.maintenance_interval_days) || 0,
      }
      if (item?.id) { await updateInventoryItem(item.id, payload); success('Updated') }
      else { await createInventoryItem(payload); success('Created') }
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
          { label: 'HSN Code', key: 'hsn_code' },
          { label: 'Total Quantity', key: 'total_quantity', as: 'number' as const }, { label: 'Unit', key: 'unit' },
          { label: 'Condition', key: 'condition', as: 'select' as const, opts: ['excellent', 'good', 'fair', 'poor'] as const },
          { label: 'Reorder Level', key: 'reorder_level', as: 'number' as const },
          { label: 'Max Parallel Events (0 = no cap)', key: 'max_parallel_events', as: 'number' as const },
          { label: 'Service Every (days, 0 = none)', key: 'maintenance_interval_days', as: 'number' as const },
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
        <div className="space-y-1">
          <label className="block text-sm font-medium">Category (catalog)</label>
          <select value={form.category_id} onChange={e => {
            const cat = (categories ?? []).find(c => c.id === e.target.value)
            setForm({ ...form, category_id: e.target.value, category: cat ? cat.name : form.category })
          }} className="w-full rounded border p-2 text-sm">
            <option value="">— none —</option>
            {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Location (godown)</label>
          <select value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })} className="w-full rounded border p-2 text-sm">
            <option value="">— none —</option>
            {(locations ?? []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  )
}

function ImportWizard({ onClose }: { onClose: () => void }) {
  const { success, error: showError } = useToast()
  const [text, setText] = useState('')
  const [report, setReport] = useState<{ valid: number; errors: { line: number; issues: string }[] } | null>(null)
  const [working, setWorking] = useState(false)

  async function runDryRun(csv: string) {
    setWorking(true)
    try { setReport(await importInventoryCsvDryRun(csv)) }
    catch (err) { showError(err instanceof Error ? err.message : String(err)) }
    setWorking(false)
  }

  async function runApply() {
    setWorking(true)
    try {
      const res = await importInventoryCsvApply(text)
      success(`Inserted ${res.inserted} items${res.errors.length ? `, ${res.errors.length} rows failed` : ''}`)
      if (res.errors.length === 0) onClose()
      else setReport({ valid: res.inserted, errors: res.errors })
    } catch (err) { showError(err instanceof Error ? err.message : String(err)) }
    setWorking(false)
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import items from CSV</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">
          Columns: name, category (required) · company, model, scope, item_type, description,
          estimated_rent_price, min_price, security_deposit, total_quantity, unit, condition,
          location, serial_number, hsn_code, target_event_types (pipe-separated). Nothing is
          written until you press Apply.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={async e => {
          const f = e.target.files?.[0]
          if (!f) return
          const csv = await f.text()
          setText(csv)
          await runDryRun(csv)
        }} className="text-sm" />
        <textarea value={text} onChange={e => { setText(e.target.value); setReport(null) }}
          placeholder="...or paste CSV here, then Validate" rows={6} className="w-full rounded border p-2 text-xs font-mono" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!text || working} onClick={() => runDryRun(text)}>
            {working ? 'Checking…' : 'Validate'}
          </Button>
          <Button size="sm" disabled={!report || report.valid === 0 || working} onClick={runApply}>
            Apply import ({report?.valid ?? 0} valid)
          </Button>
        </div>
        {report && (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">{report.valid}</span> valid rows · <span className="font-medium">{report.errors.length}</span> errors</p>
            {report.errors.slice(0, 20).map((e, i) => (
              <p key={i} className="text-xs text-red-600">Line {e.line}: {e.issues}</p>
            ))}
            {report.errors.length > 20 && <p className="text-xs">…and {report.errors.length - 20} more</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default InventoryPage
