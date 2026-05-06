'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Contact } from '@/types'
import { getContactTypeLabel, getInitials } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Phone, Mail, Building2, MapPin, Trash2 } from 'lucide-react'
import { EditContactButton } from './edit-contact-button'

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
    <div className="space-y-3 sm:space-y-4">
      {contacts.map((contact) => (
        <Card 
          key={contact.id} 
          className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300"
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              {/* Avatar & Main Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white flex items-center justify-center text-sm sm:text-lg font-semibold shadow-lg flex-shrink-0">
                  {getInitials(contact.name)}
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Name & Type */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{contact.name}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${getTypeColor(
                        contact.type
                      )}`}
                    >
                      {getContactTypeLabel(contact.type)}
                    </span>
                  </div>

                  {/* Contact Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                      <span className="truncate">{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500" />
                        <span className="truncate hidden sm:inline">{contact.email}</span>
                        <span className="truncate sm:hidden">{contact.email.length > 20 ? contact.email.slice(0, 20) + '...' : contact.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Company & Address */}
                  {(contact.company_name || contact.address) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500">
                      {contact.company_name && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                          <span className="truncate">{contact.company_name}</span>
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-1 sm:hidden">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="truncate">{contact.address.length > 25 ? contact.address.slice(0, 25) + '...' : contact.address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* GST & Notes */}
                  <div className="space-y-1">
                    {contact.gst_number && (
                      <p className="text-xs text-slate-400">
                        GST: {contact.gst_number}
                      </p>
                    )}
                    {contact.notes && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <EditContactButton 
                  contact={contact} 
                  onContactUpdated={fetchContacts} 
                />
                <button className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors">
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
