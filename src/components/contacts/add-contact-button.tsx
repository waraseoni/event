'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getContactTypeLabel } from '@/lib/utils'
import { createClient } from '@/lib/actions/contacts'
import { useToast } from '@/components/ui/toast'
import { useLanguage } from '@/contexts/language-context'

export function AddContactButton() {
  const { t, language } = useLanguage()
  const { success, error: showError } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '', type: 'customer', phone: '', email: '', address: '', company_name: '', gst_number: '', notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createClient(formData)
      setIsOpen(false)
      setFormData({ name: '', type: 'customer', phone: '', email: '', address: '', company_name: '', gst_number: '', notes: '' })
      success('Contact added'); window.location.reload()
    } catch (error) {
      console.error('Error adding contact:', error)
      showError(error instanceof Error ? error.message : 'Error adding contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {t('contacts.addNew')}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-[550px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {t('contacts.addNew')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('contacts.name')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('contacts.type')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100"
                    >
                      <option value="vendor">{getContactTypeLabel('vendor', t)}</option>
                      <option value="renter">{getContactTypeLabel('renter', t)}</option>
                      <option value="customer">{getContactTypeLabel('customer', t)}</option>
                      <option value="worker">{getContactTypeLabel('worker', t)}</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('contacts.phone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('contacts.email')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Address' : 'पता'}
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100 resize-none"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('contacts.companyName')}
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({ ...formData, company_name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('contacts.gstNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.gst_number}
                      onChange={(e) =>
                        setFormData({ ...formData, gst_number: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('contacts.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-slate-100 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm font-medium px-6 border-0 min-w-[100px]"
                >
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
