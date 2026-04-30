'use client'

import { ContactsList } from '@/components/contacts/contacts-list'
import { ContactsFilter } from '@/components/contacts/contacts-filter'
import { AddContactButton } from '@/components/contacts/add-contact-button'
import { useLanguage } from '@/contexts/language-context'

export default function ContactsPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.contacts.title')}</h1>
          <p className="text-muted-foreground">
            {t('page.contacts.description')}
          </p>
        </div>
        <AddContactButton />
      </div>
      
      <ContactsFilter />
      <ContactsList />
    </div>
  )
}
