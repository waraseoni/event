'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Contact } from '@/types'
import { getContactTypeLabel, getInitials } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Phone, Mail, Building2, MapPin, Edit, Trash2 } from 'lucide-react'

interface ContactsListProps {
  filter?: { type?: string; search?: string }
}

export function ContactsList({ filter }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [filter])

  async function fetchContacts() {
    try {
      let query = supabase.from('contacts').select('*').order('name')

      if (filter?.type) {
        query = query.eq('type', filter.type)
      }

      if (filter?.search) {
        query = query.ilike('name', `%${filter.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      vendor: 'bg-purple-100 text-purple-800',
      renter: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      worker: 'bg-orange-100 text-orange-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">कोई संपर्क नहीं मिला</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact) => (
        <Card key={contact.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                  {getInitials(contact.name)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{contact.name}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(
                        contact.type
                      )}`}
                    >
                      {getContactTypeLabel(contact.type)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {contact.email}
                      </div>
                    )}
                    {contact.company_name && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {contact.company_name}
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {contact.address}
                      </div>
                    )}
                  </div>

                  {contact.gst_number && (
                    <p className="text-sm text-muted-foreground">
                      GST: {contact.gst_number}
                    </p>
                  )}

                  {contact.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {contact.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-red-50 text-red-600 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
