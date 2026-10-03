'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTanStackQuery } from '@/hooks/use-query'
import { useToast } from '@/components/ui/toast'
import { createLocation, updateLocation, deleteLocation } from '@/lib/actions/inventory'
import { listLocations, type LocationRow } from '@/lib/queries/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

export function LocationsPage() {
  const { success, error: showError } = useToast()
  const { data: locations, isLoading, refetch } = useTanStackQuery(['inventory', 'locations'], () => listLocations())
  const [editing, setEditing] = useState<LocationRow | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete godown "${name}"? Items stored there keep their data; their location link is cleared.`)) return
    try { await deleteLocation(id); success('Deleted'); refetch() }
    catch (err) { showError(err instanceof Error ? err.message : String(err)) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/inventory" className="text-xs text-muted-foreground hover:underline">← Inventory</Link>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-sm text-muted-foreground">Godowns &amp; stores where items live.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>Add location</Button>
      </div>

      {isLoading ? (
        <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : (locations ?? []).length === 0 ? (
        <EmptyState title="No locations yet" description="Add your first godown." />
      ) : (
        <div className="rounded-xl border bg-white dark:bg-[#000000] overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Address</TableHead><TableHead>City</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {(locations ?? []).map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-xs">{l.address ?? '-'}</TableCell>
                  <TableCell>{[l.city, l.state, l.pincode].filter(Boolean).join(', ') || '-'}</TableCell>
                  <TableCell>{l.is_active ? <Badge variant="success">active</Badge> : <Badge variant="warning">inactive</Badge>}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(l); setShowForm(true) }}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id, l.name)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && <LocationForm item={editing} onClose={() => { setShowForm(false); setEditing(null); refetch() }} />}
    </div>
  )
}

function LocationForm({ item, onClose }: { item: LocationRow | null; onClose: () => void }) {
  const { success, error } = useToast()
  const [form, setForm] = useState({
    name: item?.name ?? '', address: item?.address ?? '', city: item?.city ?? '',
    state: item?.state ?? '', pincode: item?.pincode ?? '', is_active: item?.is_active ?? true,
  })
  return (
    <form onSubmit={async e => {
      e.preventDefault()
      try {
        const payload = { name: form.name, address: form.address || undefined, city: form.city || undefined, state: form.state || undefined, pincode: form.pincode || undefined, is_active: form.is_active }
        if (item?.id) { await updateLocation(item.id, payload); success('Updated') }
        else { await createLocation(payload); success('Created') }
        onClose()
      } catch (err) { error(err instanceof Error ? err.message : String(err)) }
    }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 dark:bg-[#000000] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item?.id ? 'Edit' : 'Add'} location</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        {([
          { label: 'Name', key: 'name', required: true }, { label: 'Address', key: 'address' },
          { label: 'City', key: 'city' }, { label: 'State', key: 'state' }, { label: 'Pincode', key: 'pincode' },
        ] as const).map(f => (
          <div key={f.key} className="space-y-1"><label className="block text-sm font-medium">{f.label}{'required' in f && f.required ? ' *' : ''}</label>
            <Input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={'required' in f && !!f.required} /></div>
        ))}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export default LocationsPage
