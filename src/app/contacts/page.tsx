'use client'

import { ContactsList } from '@/components/contacts/contacts-list'
import { ContactsFilter } from '@/components/contacts/contacts-filter'
import { AddContactButton } from '@/components/contacts/add-contact-button'
import { useLanguage } from '@/contexts/language-context'
import { Users, Plus } from 'lucide-react'

export default function ContactsPage() {
  const { t, language } = useLanguage()

  return (
    <div className="min-h-[calc(100vh-200px)] pb-20">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Users className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('page.contacts.title')}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {t('page.contacts.description')}
              </p>
            </div>
          </div>
          
          <AddContactButton />
        </div>
      </div>
      
      {/* Filter Section */}
      <div className="mb-4">
        <ContactsFilter />
      </div>
      
      {/* Contact List */}
      <div className="overflow-y-auto">
        <ContactsList />
      </div>
    </div>
  )
}
