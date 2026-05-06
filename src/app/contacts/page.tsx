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
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Users className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Contact Management' : 'संपर्क प्रबंधन'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Manage your customers, vendors, and team members' : 'अपने ग्राहकों, वेंडर्स और टीम को प्रबंधित करें'}
              </p>
            </div>
          </div>
          
          <div className="flex shrink-0">
            <AddContactButton />
          </div>
        </div>
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
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
