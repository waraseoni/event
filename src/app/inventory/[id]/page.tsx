'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import { useTanStackQuery } from '@/hooks/use-query'
import { useToast } from '@/components/ui/toast'
import { getItemDetail } from '@/lib/queries/inventory'
import {
  updateInventoryItem, moveStock, createSerial, deleteSerial,
  createPricingRate, deletePricingRate, createSpecialRate, deleteSpecialRate,
} from '@/lib/actions/inventory'
import { createMaintenance, completeMaintenance } from '@/lib/actions/maintenance'
import { InventoryForm } from '@/app/inventory/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { useSystemSettings } from '@/contexts/system-settings-context'
import type { InventoryItem } from '@/types'

function printQr(svgHtml: string, label: string) {
  const w = window.open('', '_blank', 'width=420,height=480')
  if (!w) return
  w.document.write(
    `<html><head><title>${label}</title></head><body style="display:flex;flex-direction:column;align-items:center;gap:12px;font-family:sans-serif;padding:24px">${svgHtml}<p style="font-size:14px">${label}</p><script>window.onload=()=>window.print()</script></body></html>`
  )
  w.document.close()
}

export function InventoryDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string)
  const { settings } = useSystemSettings()
  const { success, error: showError } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [showSerial, setShowSerial] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [showRate, setShowRate] = useState(false)
  const [showSpecial, setShowSpecial] = useState(false)
  const itemQrRef = useRef<HTMLDivElement>(null)

  const { data: detail, isLoading, refetch } = useTanStackQuery(
    ['inventory', 'detail', id],
    () => getItemDetail(id),
    { enabled: !!id }
  )

  if (isLoading || !detail) {
    return <div className="grid gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
  }

  const { item, category, location, serials, movements, maintenance, rates, specialRates } = detail
  const money = (n: number | null | undefined) =>
    n != null ? `${settings?.currency_symbol ?? '₹'}${Number(n).toLocaleString('en-IN')}` : '-'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/inventory" className="text-xs text-muted-foreground hover:underline">← Inventory</Link>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">{item.unique_code} · {item.company ?? '-'} {item.model ?? ''}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={item.status === 'available' ? 'success' : 'warning'}>{item.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>Edit</Button>
        </div>
      </div>

      <Tabs defaultValue="specs">
        <TabsList>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="rates">Rates ({rates.length + specialRates.length})</TabsTrigger>
          <TabsTrigger value="ledger">Ledger ({movements.length})</TabsTrigger>
          <TabsTrigger value="serials">Serials &amp; QR ({serials.length})</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ({maintenance.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white dark:bg-[#000000] p-5">
              <h3 className="font-semibold mb-3">Specifications</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Category', item.category ?? '-'], ['Catalog category', category?.name ?? '-'],
                  ['Company', item.company ?? '-'], ['Model', item.model ?? '-'],
                  ['Scope', item.scope ?? '-'], ['Type', item.item_type ?? '-'],
                  ['Target events', (item.target_event_types ?? []).join(', ') || '-'],
                  ['HSN', item.hsn_code ?? '-'], ['Condition', item.condition ?? '-'],
                  ['Unit', item.unit ?? '-'], ['Location', location?.name ?? item.location ?? '-'],
                  ['Total qty', String(item.total_quantity)], ['Available', String(item.available_quantity)],
                  ['Reorder level', String(item.reorder_level ?? '-')],
                  ['Max parallel events', item.max_parallel_events ? String(item.max_parallel_events) : 'no cap'],
                  ['Purchase price', money(item.purchase_price)], ['Purchase date', item.purchase_date ?? '-'],
                  ['Serial no', item.serial_number ?? '-'],
                  ['Service every', item.maintenance_interval_days ? `${item.maintenance_interval_days} days` : '-'],
                  ['Last service', item.last_maintenance_date ?? '-'], ['Next due', item.next_maintenance_date ?? '-'],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-muted-foreground text-xs">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              {item.description && <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>}
            </div>
            <div className="rounded-xl border bg-white dark:bg-[#000000] p-5 flex flex-col items-center justify-center gap-3">
              <h3 className="font-semibold self-start">Item QR</h3>
              <div ref={itemQrRef} className="bg-white p-3 rounded"><QRCode value={item.unique_code} size={160} /></div>
              <p className="text-xs text-muted-foreground">Scan → opens this item. Code: {item.unique_code}</p>
              <Button variant="outline" size="sm" onClick={() => {
                const svg = itemQrRef.current?.querySelector('svg')?.outerHTML ?? ''
                printQr(svg, `${item.name} · ${item.unique_code}`)
              }}>Print QR</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Rate card</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRate(true)}>Add rate</Button>
              <Button variant="outline" size="sm" onClick={() => setShowSpecial(true)}>Add season rate</Button>
            </div>
          </div>
          {rates.length === 0 && specialRates.length === 0 ? (
            <EmptyState title="No rates yet" description="Add a base rate so quotes can price this item." />
          ) : (
            <>
              {rates.map(r => (
                <RateRow key={r.id} label={`${r.rental_type}${r.min_rental_days && r.min_rental_days > 1 ? ` · min ${r.min_rental_days}d` : ''}`}
                  value={`${money(r.rate)}${r.security_deposit ? ` · deposit ${money(r.security_deposit)}` : ''}`}
                  onDelete={async () => { if (!confirm('Delete rate?')) return; try { await deletePricingRate(r.id); success('Deleted'); refetch() } catch (e) { showError(e instanceof Error ? e.message : String(e)) } }} />
              ))}
              {specialRates.map(s => (
                <RateRow key={s.id} label={`${s.name} (${s.rate_type} ×${s.rate_value}) · ${s.start_date} → ${s.end_date}`}
                  value={s.notes ?? ''}
                  onDelete={async () => { if (!confirm('Delete season rate?')) return; try { await deleteSpecialRate(s.id); success('Deleted'); refetch() } catch (e) { showError(e instanceof Error ? e.message : String(e)) } }} />
              ))}
            </>
          )}
          {showRate && <RateForm itemId={item.id} onClose={() => { setShowRate(false); refetch() }} />}
          {showSpecial && <SpecialRateForm itemId={item.id} onClose={() => { setShowSpecial(false); refetch() }} />}
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Stock ledger <span className="text-muted-foreground font-normal">(avail {item.available_quantity} / total {item.total_quantity})</span></h3>
            <Button variant="outline" size="sm" onClick={() => setShowAdjust(true)}>Adjust stock</Button>
          </div>
          {movements.length === 0 ? (
            <EmptyState title="No movements" description="Every quantity change will appear here." />
          ) : (
            <div className="rounded-xl border bg-white dark:bg-[#000000] overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Movement</TableHead><TableHead>Qty</TableHead><TableHead>Balance</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                <TableBody>
                  {movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</TableCell>
                      <TableCell><Badge variant="info">{m.movement}</Badge></TableCell>
                      <TableCell className={Number(m.quantity) < 0 ? 'text-red-600' : 'text-green-600'}>
                        {Number(m.quantity) > 0 ? `+${m.quantity}` : m.quantity}
                      </TableCell>
                      <TableCell className="font-medium">{m.running_balance}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.notes ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {showAdjust && <AdjustForm item={item} onClose={() => { setShowAdjust(false); refetch() }} />}
        </TabsContent>

        <TabsContent value="serials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Serialized units</h3>
            <Button variant="outline" size="sm" onClick={() => setShowSerial(true)}>Add serial</Button>
          </div>
          {serials.length === 0 ? (
            <EmptyState title="No serials tracked" description="Add one row per physical unit to track condition and print QR labels." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {serials.map(s => <SerialCard key={s.id} serialId={s.id} code={s.serial_code} qr={s.qr_code ?? `QR:${s.serial_code}`} condition={s.condition ?? 'good'} status={s.status ?? 'available'} refetch={refetch} />)}
            </div>
          )}
          {showSerial && <SerialForm itemId={item.id} onClose={() => { setShowSerial(false); refetch() }} />}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Maintenance history</h3>
            <Button variant="outline" size="sm" onClick={() => setShowMaintenance(true)}>New record</Button>
          </div>
          {maintenance.length === 0 ? (
            <EmptyState title="No maintenance yet" description="Repairs and services will appear here." />
          ) : (
            <div className="rounded-xl border bg-white dark:bg-[#000000] overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Started</TableHead><TableHead>Completed</TableHead><TableHead>Cost</TableHead><TableHead>Description</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {maintenance.map(m => (
                    <TableRow key={m.id}>
                      <TableCell><Badge variant={m.completed_at ? 'info' : 'warning'}>{m.maintenance_type}</Badge></TableCell>
                      <TableCell className="text-xs">{m.started_at ? new Date(m.started_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-xs">{m.completed_at ? new Date(m.completed_at).toLocaleDateString() : 'open'}</TableCell>
                      <TableCell>{money(m.cost)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.description ?? '-'}</TableCell>
                      <TableCell>{!m.completed_at && <CompleteButton id={m.id} refetch={refetch} />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {showMaintenance && <MaintenanceForm itemId={item.id} onClose={() => { setShowMaintenance(false); refetch() }} />}
        </TabsContent>
      </Tabs>

      {showForm && <InventoryForm item={item as InventoryItem} onClose={() => { setShowForm(false); refetch() }} saving={false} />}
    </div>
  )
}

function RateRow({ label, value, onDelete }: { label: string; value: string; onDelete: () => void }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-[#000000] p-4 flex items-center justify-between gap-3">
      <div><p className="font-medium text-sm">{label}</p>{value && <p className="text-xs text-muted-foreground">{value}</p>}</div>
      <Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button>
    </div>
  )
}

function AdjustForm({ item, onClose }: { item: { id: string }; onClose: () => void }) {
  const { success, error } = useToast()
  const [movement, setMovement] = useState('adjust')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      try { await moveStock({ itemId: item.id, movement, quantity: Number(quantity), notes: notes || undefined }); success('Stock adjusted'); onClose() }
      catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="rounded-xl border bg-white dark:bg-[#000000] p-4 space-y-3">
      <h4 className="font-semibold text-sm">Adjust stock (writes a ledger row)</h4>
      <div className="grid grid-cols-3 gap-2">
        <select value={movement} onChange={e => setMovement(e.target.value)} className="rounded border p-2 text-sm">
          {['purchase', 'rent_in', 'rent_out', 'event_pickup', 'event_return', 'transfer', 'adjust', 'damage', 'retire', 'maintenance'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Input placeholder="Qty (+in / −out)" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} required />
        <Input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div className="flex gap-2"><Button type="submit" size="sm">Apply</Button><Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button></div>
    </form>
  )
}

function SerialForm({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { success, error } = useToast()
  const [code, setCode] = useState('')
  const [condition, setCondition] = useState('good')
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      try { await createSerial({ item_id: itemId, serial_code: code, condition }); success('Serial added'); onClose() }
      catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="rounded-xl border bg-white dark:bg-[#000000] p-4 flex gap-2">
      <Input placeholder="Serial code (e.g. SN-0001)" value={code} onChange={e => setCode(e.target.value)} required className="max-w-xs" />
      <select value={condition} onChange={e => setCondition(e.target.value)} className="rounded border p-2 text-sm">
        {['excellent', 'good', 'fair', 'poor'].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <Button type="submit" size="sm">Add</Button>
      <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
    </form>
  )
}

function SerialCard({ serialId, code, qr, condition, status, refetch }: {
  serialId: string; code: string; qr: string; condition: string; status: string; refetch: () => void
}) {
  const { success, error } = useToast()
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div className="rounded-xl border bg-white dark:bg-[#000000] p-4 flex gap-4 items-center">
      <div ref={ref} className="bg-white p-1 rounded shrink-0"><QRCode value={qr} size={72} /></div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{code}</p>
        <p className="text-xs text-muted-foreground">{condition} · {status}</p>
        <div className="mt-2 flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => {
            const svg = ref.current?.querySelector('svg')?.outerHTML ?? ''
            printQr(svg, code)
          }}>Print</Button>
          <Button variant="ghost" size="sm" onClick={async () => {
            if (!confirm('Delete serial?')) return
            try { await deleteSerial(serialId); success('Deleted'); refetch() }
            catch (e) { error(e instanceof Error ? e.message : String(e)) }
          }}>Delete</Button>
        </div>
      </div>
    </div>
  )
}

function MaintenanceForm({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { success, error } = useToast()
  const [form, setForm] = useState({ maintenance_type: 'service', description: '', cost: '', started_at: new Date().toISOString().slice(0, 10), notes: '' })
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      try {
        await createMaintenance({ item_id: itemId, maintenance_type: form.maintenance_type, description: form.description || undefined, cost: Number(form.cost) || 0, started_at: form.started_at, notes: form.notes || undefined })
        success('Record created — item set to maintenance'); onClose()
      } catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="rounded-xl border bg-white dark:bg-[#000000] p-4 space-y-3">
      <h4 className="font-semibold text-sm">New maintenance record</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <select value={form.maintenance_type} onChange={e => setForm({ ...form, maintenance_type: e.target.value })} className="rounded border p-2 text-sm">
          {['repair', 'service', 'calibration', 'upgrade', 'other'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Input type="date" value={form.started_at} onChange={e => setForm({ ...form, started_at: e.target.value })} required />
        <Input placeholder="Cost" inputMode="decimal" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
        <Input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-2"><Button type="submit" size="sm">Save</Button><Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button></div>
    </form>
  )
}

function CompleteButton({ id, refetch }: { id: string; refetch: () => void }) {
  const { success, error } = useToast()
  return (
    <Button variant="outline" size="sm" onClick={async () => {
      try { await completeMaintenance(id, {}); success('Completed — item available again'); refetch() }
      catch (e) { error(e instanceof Error ? e.message : String(e)) }
    }}>Complete</Button>
  )
}

function RateForm({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { success, error } = useToast()
  const [form, setForm] = useState({ rental_type: 'daily', rate: '', security_deposit: '', min_rental_days: '1' })
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      try {
        await createPricingRate({ inventory_item_id: itemId, rental_type: form.rental_type, rate: Number(form.rate), security_deposit: Number(form.security_deposit) || undefined, min_rental_days: Number(form.min_rental_days) || 1 })
        success('Rate added'); onClose()
      } catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="rounded-xl border bg-white dark:bg-[#000000] p-4 flex flex-wrap gap-2">
      <select value={form.rental_type} onChange={e => setForm({ ...form, rental_type: e.target.value })} className="rounded border p-2 text-sm">
        {['daily', 'weekly', 'monthly', 'per_event'].map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <Input placeholder="Rate" inputMode="decimal" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} required className="max-w-[10rem]" />
      <Input placeholder="Deposit (opt)" inputMode="decimal" value={form.security_deposit} onChange={e => setForm({ ...form, security_deposit: e.target.value })} className="max-w-[10rem]" />
      <Input placeholder="Min days" inputMode="numeric" value={form.min_rental_days} onChange={e => setForm({ ...form, min_rental_days: e.target.value })} className="max-w-[8rem]" />
      <Button type="submit" size="sm">Add</Button>
      <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
    </form>
  )
}

function SpecialRateForm({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { success, error } = useToast()
  const [form, setForm] = useState({ name: '', rate_type: 'multiplier', rate_value: '', start_date: '', end_date: '', notes: '' })
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      try {
        await createSpecialRate({ item_id: itemId, name: form.name, rate_type: form.rate_type, rate_value: Number(form.rate_value), start_date: form.start_date, end_date: form.end_date, notes: form.notes || undefined })
        success('Season rate added'); onClose()
      } catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="rounded-xl border bg-white dark:bg-[#000000] p-4 space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Input placeholder="Name (e.g. Diwali)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <select value={form.rate_type} onChange={e => setForm({ ...form, rate_type: e.target.value })} className="rounded border p-2 text-sm">
          <option value="multiplier">Multiplier (×)</option><option value="fixed">Fixed rate</option>
        </select>
        <Input placeholder="Value (e.g. 1.5)" inputMode="decimal" value={form.rate_value} onChange={e => setForm({ ...form, rate_value: e.target.value })} required />
        <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
        <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
        <Input placeholder="Notes (opt)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="flex gap-2"><Button type="submit" size="sm">Add</Button><Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button></div>
    </form>
  )
}

export default InventoryDetailPage
