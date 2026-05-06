'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Contact } from '@/types'
import { useLanguage } from '@/contexts/language-context'

interface EditContactButtonProps {
  contact: Contact
  onContactUpdated: () => void
}

export function EditContactButton({ contact, onContactUpdated }: EditContactButtonProps) {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Contact>({
    ...contact,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (supabase
        .from('contacts')
        .update as any)({
          name: formData.name,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          company_name: formData.company_name,
          gst_number: formData.gst_number,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contact.id)

      if (error) throw error

      setIsOpen(false)
      onContactUpdated()
    } catch (error) {
      console.error('Error updating contact:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-muted rounded"
      >
        <Edit className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-2xl sm:rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {language === 'en' ? 'Edit Contact' : 'संपर्क संपादित करें'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Name' : 'नाम'} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Type' : 'प्रकार'} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, type: value as Contact['type'] })
                    }
                  >
                    <SelectTrigger id="edit-type" className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">
                        {language === 'en' ? 'Customer' : 'ग्राहक'}
                      </SelectItem>
                      <SelectItem value="vendor">
                        {language === 'en' ? 'Vendor' : 'विक्रेता'}
                      </SelectItem>
                      <SelectItem value="renter">
                        {language === 'en' ? 'Renter' : 'किरायेदार'}
                      </SelectItem>
                      <SelectItem value="worker">
                        {language === 'en' ? 'Worker' : 'कर्मचारी'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Phone' : 'फोन'} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Email' : 'ईमेल'}
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'Address' : 'पता'}
                </Label>
                <Textarea
                  id="edit-address"
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={2}
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-company" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Company Name' : 'कंपनी का नाम'}
                  </Label>
                  <Input
                    id="edit-company"
                    value={formData.company_name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-gst" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'GST Number' : 'जीएसटी नंबर'}
                  </Label>
                  <Input
                    id="edit-gst"
                    value={formData.gst_number || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, gst_number: e.target.value })
                    }
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'Notes' : 'नोट्स'}
                </Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm font-medium px-6 border-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {language === 'en' ? 'Save Changes' : 'बदलाव सहेजें'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
